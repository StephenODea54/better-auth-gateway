CREATE TABLE "wide_event" (
	"attributes" jsonb NOT NULL,
	"duration_ms" integer NOT NULL,
	"http_path" text NOT NULL,
	"http_status" integer NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"organization_id" text,
	"trace_id" text NOT NULL,
	"user_id" text
);
--> statement-breakpoint
CREATE INDEX "wide_event_attributes_idx" ON "wide_event" USING gin ("attributes");--> statement-breakpoint
CREATE INDEX "wide_event_occurred_at_idx" ON "wide_event" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "wide_event_organization_id_idx" ON "wide_event" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "wide_event_user_id_idx" ON "wide_event" USING btree ("user_id");