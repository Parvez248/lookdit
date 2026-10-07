ALTER TABLE "projects" ADD COLUMN "client_id" uuid;--> statement-breakpoint
-- Rows that exist before this migration are portfolio entries (finished work),
-- so they are filled with 'completed'; new rows then default to 'planned'.
ALTER TABLE "projects" ADD COLUMN "work_status" text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "work_status" SET DEFAULT 'planned';--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_client_id_idx" ON "projects" USING btree ("client_id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_work_status_allowed" CHECK ("projects"."work_status" IN ('planned', 'active', 'on_hold', 'completed', 'cancelled'));