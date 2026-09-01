import { createMiddleware } from "@tanstack/react-start";
import { AsyncLocalStorage } from "node:async_hooks";
import process from "node:process";

import type { wideEvent } from "@/db/schema/wide-event-schema.ts";

type EventFields = Record<string, unknown>;

const BATCH_SIZE = 50;
const FLUSH_MS = 500;
const SAMPLE_RATE = 0.05;
const SLOW_MS = 1000;

const queue: (typeof wideEvent.$inferInsert)[] = [];
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let storage: AsyncLocalStorage<EventFields> | undefined;

export function countEvent(key: string) {
  const event = storage?.getStore();

  if (event) {
    event[key] = (event[key] as number ?? 0) + 1;
  }
}

export function setEvent(fields: EventFields) {
  Object.assign(storage?.getStore() ?? {}, fields);
}

export function setEventError(error: unknown) {
  setEvent({ "error.cause": error instanceof Error ? error.message : String(error) });
}

export const serverFnNameMiddleware = createMiddleware({ type: "function" })
  .server(({ next, serverFnMeta }) => {
    setEvent({ "handler.name": serverFnMeta.name });

    return next();
  });

export const wideEventMiddleware = createMiddleware({ type: "request" })
  .server(async ({ handlerType, next, request }) => {
    storage ??= new AsyncLocalStorage<EventFields>();

    const event: EventFields = {
      "event.id": crypto.randomUUID(),
      "handler.type": handlerType,
      "http.method": request.method,
      "http.path": new URL(request.url).pathname,
      "trace.id": request.headers.get("traceparent")?.split("-")[1] ?? crypto.randomUUID(),
    };
    const startedAt = performance.now();

    return storage.run(event, async () => {
      try {
        const result = await next();
        event["http.status"] = result.response.status;
        return result;
      }
      catch (error) {
        event["error.message"] = error instanceof Error ? error.message : String(error);
        event["error.type"] = error instanceof Error ? error.name : typeof error;
        event["http.status"] = 500;
        throw error;
      }
      finally {
        event.duration_ms = Math.round(performance.now() - startedAt);
        event.timestamp = new Date().toISOString();
        process.stdout.write(`${import.meta.env.DEV ? formatForDev(event) : JSON.stringify(event)}\n`);

        if (shouldPersist(event)) {
          persist(event);
        }
      }
    });
  });

async function flush() {
  clearTimeout(flushTimer);
  flushTimer = undefined;

  const rows = queue.splice(0, queue.length);

  if (rows.length === 0) {
    return;
  }

  const [{ db }, { wideEvent }] = await Promise.all([
    import("@/db/clients/db-client.ts"),
    import("@/db/schema/wide-event-schema.ts"),
  ]);

  try {
    await db.insert(wideEvent).values(rows);
  }
  catch (error) {
    process.stderr.write(`wide-event flush failed: ${String(error)}\n`);
  }
}

function formatForDev(event: EventFields) {
  const {
    duration_ms: duration,
    "event.id": _eventId,
    "http.method": method,
    "http.path": path,
    "http.status": status,
    timestamp: _timestamp,
    "trace.id": _traceId,
    ...rest
  } = event;

  const extras = Object.entries(rest)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`);

  return [method, path, status, `${duration}ms`, ...extras].join(" ");
}

function persist(event: EventFields) {
  queue.push({
    attributes: { ...event },
    durationMs: event.duration_ms as number,
    httpPath: event["http.path"] as string,
    httpStatus: event["http.status"] as number,
    id: event["event.id"] as string,
    occurredAt: new Date(event.timestamp as string),
    organizationId: event["organization.id"] as string | undefined,
    traceId: event["trace.id"] as string,
    userId: event["user.id"] as string | undefined,
  });

  if (queue.length >= BATCH_SIZE) {
    void flush();
    return;
  }

  flushTimer ??= setTimeout(() => void flush(), FLUSH_MS).unref();
}

function shouldPersist(event: EventFields) {
  return (event["http.status"] as number) >= 400
    || event["error.type"] !== undefined
    || event["error.cause"] !== undefined
    || event["authz.allowed"] !== undefined
    || event["handler.type"] === "serverFn"
    || (event["http.path"] as string).startsWith("/api/auth")
    || (event.duration_ms as number) >= SLOW_MS
    || Math.random() < SAMPLE_RATE;
}
