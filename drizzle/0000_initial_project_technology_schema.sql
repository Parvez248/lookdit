CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"client" text,
	"category" text NOT NULL,
	"year" smallint NOT NULL,
	"summary" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 1000 NOT NULL,
	"live_url" text,
	"metrics" jsonb,
	"seo_title" text,
	"seo_description" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug"),
	CONSTRAINT "projects_slug_format" CHECK ("projects"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "projects_category_allowed" CHECK ("projects"."category" IN ('web-app', 'website', 'product-design')),
	CONSTRAINT "projects_status_allowed" CHECK ("projects"."status" IN ('draft', 'published', 'archived')),
	CONSTRAINT "projects_year_range" CHECK ("projects"."year" BETWEEN 2000 AND 2100),
	CONSTRAINT "projects_published_requires_published_at" CHECK ("projects"."status" <> 'published' OR "projects"."published_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "technologies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "technologies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"icon_key" text,
	"url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 1000 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technologies_slug_unique" UNIQUE("slug"),
	CONSTRAINT "technologies_slug_format" CHECK ("technologies"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "technologies_category_allowed" CHECK ("technologies"."category" IN ('language', 'framework', 'runtime', 'database', 'infra', 'design-tool'))
);
--> statement-breakpoint
CREATE TABLE "project_technologies" (
	"project_id" uuid NOT NULL,
	"technology_id" integer NOT NULL,
	CONSTRAINT "project_technologies_pkey" PRIMARY KEY("project_id","technology_id")
);
--> statement-breakpoint
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_technology_id_technologies_id_fk" FOREIGN KEY ("technology_id") REFERENCES "public"."technologies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_listing_idx" ON "projects" USING btree ("status","featured" DESC NULLS LAST,"display_order","year" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "technologies_active_order_idx" ON "technologies" USING btree ("is_active","display_order");--> statement-breakpoint
CREATE INDEX "project_technologies_technology_id_idx" ON "project_technologies" USING btree ("technology_id");