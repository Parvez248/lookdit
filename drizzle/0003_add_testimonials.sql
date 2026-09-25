CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"project_id" uuid,
	"quote" text NOT NULL,
	"author_name" text NOT NULL,
	"author_role" text,
	"company" text,
	"avatar_storage_key" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"display_order" integer DEFAULT 1000 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "testimonials_status_allowed" CHECK ("testimonials"."status" IN ('pending', 'approved', 'published', 'archived')),
	CONSTRAINT "testimonials_quote_not_blank" CHECK (length(btrim("testimonials"."quote")) > 0),
	CONSTRAINT "testimonials_author_name_not_blank" CHECK (length(btrim("testimonials"."author_name")) > 0),
	CONSTRAINT "testimonials_published_requires_published_at" CHECK ("testimonials"."status" <> 'published' OR "testimonials"."published_at" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "testimonials_status_order_idx" ON "testimonials" USING btree ("status","display_order","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "testimonials_project_id_idx" ON "testimonials" USING btree ("project_id");