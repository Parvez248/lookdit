CREATE TABLE "project_media" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"project_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"role" text NOT NULL,
	"storage_key" text NOT NULL,
	"alt" text,
	"width" integer,
	"height" integer,
	"mime_type" text,
	"file_size" integer,
	"display_order" integer DEFAULT 1000 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_media_project_storage_unique" UNIQUE("project_id","storage_key"),
	CONSTRAINT "project_media_kind_allowed" CHECK ("project_media"."kind" IN ('image', 'video')),
	CONSTRAINT "project_media_role_allowed" CHECK ("project_media"."role" IN ('hero', 'gallery', 'thumbnail', 'detail')),
	CONSTRAINT "project_media_width_positive" CHECK ("project_media"."width" IS NULL OR "project_media"."width" > 0),
	CONSTRAINT "project_media_height_positive" CHECK ("project_media"."height" IS NULL OR "project_media"."height" > 0),
	CONSTRAINT "project_media_file_size_positive" CHECK ("project_media"."file_size" IS NULL OR "project_media"."file_size" > 0)
);
--> statement-breakpoint
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_media_one_hero_per_project_idx" ON "project_media" USING btree ("project_id") WHERE "project_media"."role" = 'hero';--> statement-breakpoint
CREATE INDEX "project_media_project_order_idx" ON "project_media" USING btree ("project_id","display_order");