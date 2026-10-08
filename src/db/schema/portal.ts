import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { clients } from "./clients";

// Client portal auth (/portal). Deliberately separate from the staff tables in
// ./auth: a client session can never satisfy requireUser(), and a staff session
// can never satisfy requireClient(), because each reads only its own tables.

/**
 * Client accounts: one sign-in per client record, read-only access to that
 * client's projects. No sign-up: accounts come from `pnpm portal:create-account`.
 * Deleting the client deletes the account (and, through it, its sessions).
 */
export const clientAccounts = pgTable(
  "client_accounts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    // Stored trimmed and lower-case (enforced below), so lookups are exact matches.
    email: text("email").notNull(),
    name: text("name").notNull(),
    // Same format as users.password_hash: src/lib/auth/password.ts. Never returned
    // outside the sign-in check.
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("client_accounts_email_key").on(table.email),
    // One account per client for now; also serves the FK cascade.
    uniqueIndex("client_accounts_client_id_key").on(table.clientId),
    check("client_accounts_email_normalized", sql`${table.email} = lower(btrim(${table.email}))`),
    check("client_accounts_email_not_blank", sql`length(${table.email}) > 0`),
    check("client_accounts_name_not_blank", sql`length(btrim(${table.name})) > 0`),
    check("client_accounts_password_hash_format", sql`${table.passwordHash} LIKE 'scrypt$%'`),
  ],
);

/**
 * Client sessions: same model as staff sessions. The cookie holds a random
 * token; only its SHA-256 is stored.
 */
export const clientSessions = pgTable(
  "client_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => clientAccounts.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("client_sessions_token_hash_format", sql`${table.tokenHash} ~ '^[0-9a-f]{64}$'`),
    // Serves the FK cascade and the per-account cleanup of expired sessions at sign-in.
    index("client_sessions_account_id_idx").on(table.accountId),
  ],
);

/**
 * The /portal sign-in throttle. Same shape and rules as sign_in_attempts, kept
 * apart so failed client sign-ins never count against staff sign-in.
 *
 * PRIVACY: both keys are HMAC-SHA-256 fingerprints, never a raw IP or email.
 */
export const clientSignInAttempts = pgTable(
  "client_sign_in_attempts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    emailFingerprint: text("email_fingerprint").notNull(),
    ipFingerprint: text("ip_fingerprint").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "client_sign_in_attempts_email_fingerprint_format",
      sql`${table.emailFingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "client_sign_in_attempts_ip_fingerprint_format",
      sql`${table.ipFingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    index("client_sign_in_attempts_email_created_at_idx").on(
      table.emailFingerprint,
      table.createdAt.desc(),
    ),
    index("client_sign_in_attempts_ip_created_at_idx").on(
      table.ipFingerprint,
      table.createdAt.desc(),
    ),
  ],
);
