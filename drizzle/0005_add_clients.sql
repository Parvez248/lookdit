CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"email" text,
	"phone" text,
	"website" text,
	"notes" text,
	"status" text DEFAULT 'lead' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_status_allowed" CHECK ("clients"."status" IN ('lead', 'active', 'past')),
	CONSTRAINT "clients_name_not_blank" CHECK (length(btrim("clients"."name")) > 0),
	CONSTRAINT "clients_company_not_blank" CHECK ("clients"."company" IS NULL OR length(btrim("clients"."company")) > 0),
	CONSTRAINT "clients_email_not_blank" CHECK ("clients"."email" IS NULL OR length(btrim("clients"."email")) > 0),
	CONSTRAINT "clients_phone_not_blank" CHECK ("clients"."phone" IS NULL OR length(btrim("clients"."phone")) > 0),
	CONSTRAINT "clients_website_not_blank" CHECK ("clients"."website" IS NULL OR length(btrim("clients"."website")) > 0),
	CONSTRAINT "clients_notes_not_blank" CHECK ("clients"."notes" IS NULL OR length(btrim("clients"."notes")) > 0)
);
--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inquiries_client_id_created_at_idx" ON "inquiries" USING btree ("client_id","created_at" DESC NULLS LAST) WHERE "inquiries"."client_id" IS NOT NULL;