import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const wideEvent = pgTable("wide_event", {
  attributes: jsonb("attributes").notNull(),
  durationMs: integer("duration_ms").notNull(),
  httpPath: text("http_path").notNull(),
  httpStatus: integer("http_status").notNull(),
  id: text("id").primaryKey(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  organizationId: text("organization_id"),
  traceId: text("trace_id").notNull(),
  userId: text("user_id"),
}, table => [
  index("wide_event_attributes_idx").using("gin", table.attributes),
  index("wide_event_occurred_at_idx").on(table.occurredAt),
  index("wide_event_organization_id_idx").on(table.organizationId),
  index("wide_event_user_id_idx").on(table.userId),
]);
