CREATE TABLE "project_milestones" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"due_on" date,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_milestones_project_id_id_unique" UNIQUE("project_id","id"),
	CONSTRAINT "project_milestones_title_not_blank" CHECK (length(btrim("project_milestones"."title")) > 0)
);
--> statement-breakpoint
CREATE TABLE "project_tasks" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"project_id" uuid NOT NULL,
	"milestone_id" uuid,
	"title" text NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"due_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_tasks_status_allowed" CHECK ("project_tasks"."status" IN ('todo', 'doing', 'done')),
	CONSTRAINT "project_tasks_title_not_blank" CHECK (length(btrim("project_tasks"."title")) > 0)
);
--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Edited by hand: drizzle can't express a column list on SET NULL. Deleting a
-- milestone clears only milestone_id (project_id is NOT NULL and must stay), so
-- its tasks remain on the project without a milestone. Needs PostgreSQL 15+.
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_milestone_fk" FOREIGN KEY ("project_id","milestone_id") REFERENCES "public"."project_milestones"("project_id","id") ON DELETE SET NULL ("milestone_id") ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_tasks_project_id_milestone_id_idx" ON "project_tasks" USING btree ("project_id","milestone_id");