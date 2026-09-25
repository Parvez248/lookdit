CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"ip_fingerprint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inquiries_status_allowed" CHECK ("inquiries"."status" IN ('new', 'reviewing', 'replied', 'closed', 'spam')),
	CONSTRAINT "inquiries_name_not_blank" CHECK (length(btrim("inquiries"."name")) > 0),
	CONSTRAINT "inquiries_email_not_blank" CHECK (length(btrim("inquiries"."email")) > 0),
	CONSTRAINT "inquiries_message_not_blank" CHECK (length(btrim("inquiries"."message")) > 0),
	CONSTRAINT "inquiries_ip_fingerprint_format" CHECK ("inquiries"."ip_fingerprint" IS NULL OR "inquiries"."ip_fingerprint" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE INDEX "inquiries_created_at_idx" ON "inquiries" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "inquiries_status_created_at_idx" ON "inquiries" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "inquiries_ip_fingerprint_created_at_idx" ON "inquiries" USING btree ("ip_fingerprint","created_at" DESC NULLS LAST) WHERE "inquiries"."ip_fingerprint" IS NOT NULL;