import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import type { ApiFnReturnType, QueryConfig } from "@/lib/react-query.ts";

import { db } from "@/db/clients/db-client.ts";
import { wideEvent } from "@/db/schema/wide-event-schema.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { setEventError } from "@/lib/wide-event.ts";

export const EVENT_KINDS = [
  "application.registered",
  "application.updated",
  "application.deleted",
  "member.added",
  "member.removed",
  "member.roles_updated",
  "role.created",
  "role.updated",
  "role.deleted",
  "resource.saved",
  "resource.deleted",
] as const;

export const PAGE_SIZE = 25;

export const listEventsInputSchema = z.object({
  kind: z.string().optional(),
  organizationId: z.string().min(1),
  page: z.number().int().min(0).default(0),
  search: z.string().optional(),
});

export type ListEventsInput = z.infer<typeof listEventsInputSchema>;

export const listEvents = createServerFn()
  .validator(listEventsInputSchema)
  .handler(async ({ data }) => {
    const { success } = await auth.api.hasPermission({
      body: {
        organizationId: data.organizationId,
        permissions: { organization: ["update"] },
      },
      headers: getRequest().headers,
    });

    if (!success) {
      throw new Error("You do not have permission to view this application's activity.");
    }

    const where = and(
      eq(wideEvent.organizationId, data.organizationId),
      data.kind ? sql`${wideEvent.attributes}->>'event.kind' = ${data.kind}` : undefined,
      data.search
        ? sql`${wideEvent.attributes}->>'user.email' ilike ${`%${data.search}%`}`
        : undefined,
    );

    try {
      const [rows, totals] = await Promise.all([
        db
          .select({
            actorEmail: sql<null | string>`${wideEvent.attributes}->>'user.email'`,
            denied: sql<null | string>`${wideEvent.attributes}->>'authz.allowed'`,
            durationMs: wideEvent.durationMs,
            errorCause: sql<null | string>`${wideEvent.attributes}->>'error.cause'`,
            handlerName: sql<null | string>`${wideEvent.attributes}->>'handler.name'`,
            httpStatus: wideEvent.httpStatus,
            id: wideEvent.id,
            kind: sql<null | string>`${wideEvent.attributes}->>'event.kind'`,
            occurredAt: wideEvent.occurredAt,
          })
          .from(wideEvent)
          .where(where)
          .orderBy(desc(wideEvent.occurredAt))
          .limit(PAGE_SIZE)
          .offset(data.page * PAGE_SIZE),
        db.select({ value: count() }).from(wideEvent).where(where),
      ]);

      return {
        matchCount: totals[0]?.value ?? 0,
        rows: rows.map(row => ({
          ...row,
          denied: row.denied === "false",
        })),
      };
    }
    catch (error) {
      setEventError(error);
      throw new Error("Could not load this application's activity.");
    }
  });

export type ActivityEvent = ApiFnReturnType<typeof listEvents>["rows"][number];

interface UseEventsOptions {
  input: ListEventsInput;
  queryConfig?: QueryConfig<typeof listEventsQueryOptions>;
}

export function listEventsQueryOptions(input: ListEventsInput) {
  return queryOptions({
    enabled: input.organizationId.length > 0,
    placeholderData: keepPreviousData,
    queryFn: () => listEvents({ data: input }),
    queryKey: ["activity", input],
  });
}

export function useEvents({ input, queryConfig }: UseEventsOptions) {
  return useQuery({
    ...listEventsQueryOptions(input),
    ...queryConfig,
  });
}
