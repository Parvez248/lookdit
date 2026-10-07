CREATE TABLE "client_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"client_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_accounts_email_normalized" CHECK ("client_accounts"."email" = lower(btrim("client_accounts"."email"))),
	CONSTRAINT "client_accounts_email_not_blank" CHECK (length("client_accounts"."email") > 0),
	CONSTRAINT "client_accounts_name_not_blank" CHECK (length(btrim("client_accounts"."name")) > 0),
	CONSTRAINT "client_accounts_password_hash_format" CHECK ("client_accounts"."password_hash" LIKE 'scrypt$%')
);
--> statement-breakpoint
CREATE TABLE "client_sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_sessions_token_hash_format" CHECK ("client_sessions"."token_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "client_sign_in_attempts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"email_fingerprint" text NOT NULL,
	"ip_fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_sign_in_attempts_email_fingerprint_format" CHECK ("client_sign_in_attempts"."email_fingerprint" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "client_sign_in_attempts_ip_fingerprint_format" CHECK ("client_sign_in_attempts"."ip_fingerprint" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_sessions" ADD CONSTRAINT "client_sessions_account_id_client_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."client_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "client_accounts_email_key" ON "client_accounts" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "client_accounts_client_id_key" ON "client_accounts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_sessions_account_id_idx" ON "client_sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "client_sign_in_attempts_email_created_at_idx" ON "client_sign_in_attempts" USING btree ("email_fingerprint","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "client_sign_in_attempts_ip_created_at_idx" ON "client_sign_in_attempts" USING btree ("ip_fingerprint","created_at" DESC NULLS LAST);