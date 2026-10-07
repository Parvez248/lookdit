import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * Users — LOOKDIT staff accounts for /admin (private data). There is no public
 * sign-up: accounts are created by `scripts/create-admin-user.ts`. Every user is
 * staff, so there is no role column until a second kind of user exists.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    // Stored trimmed and lower-case (enforced below), so lookups are exact matches.
    email: text("email").notNull(),
    name: text("name").notNull(),
    // `scrypt$<log2 N>$<r>$<p>$<salt>$<hash>` from src/lib/auth/password.ts. Never
    // a plain or fast hash, and never returned outside the sign-in check.
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_key").on(table.email),
    check("users_email_normalized", sql`${table.email} = lower(btrim(${table.email}))`),
    check("users_email_not_blank", sql`length(${table.email}) > 0`),
    check("users_name_not_blank", sql`length(btrim(${table.name})) > 0`),
    check("users_password_hash_format", sql`${table.passwordHash} LIKE 'scrypt$%'`),
  ],
);

/**
 * Sessions — one row per signed-in browser. The cookie holds a random token; only
 * its SHA-256 (64 lowercase hex) is stored, so a leaked table cannot be replayed
 * as cookies. Deleting a user deletes their sessions.
 */
export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("sessions_token_hash_format", sql`${table.tokenHash} ~ '^[0-9a-f]{64}$'`),
    // Serves the FK cascade and the per-user cleanup of expired sessions at sign-in.
    index("sessions_user_id_idx").on(table.userId),
  ],
);

/**
 * Sign-in attempts — the throttle for /admin sign-in. A row is reserved before
 * the password is checked and deleted when the sign-in succeeds, so the rows
 * left in the window are failures (and in-flight attempts).
 *
 * PRIVACY: both keys are HMAC-SHA-256 fingerprints (64 lowercase hex), never a
 * raw IP or a raw email address. See src/lib/auth/sign-in-keys.ts.
 */
export const signInAttempts = pgTable(
  "sign_in_attempts",
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
      "sign_in_attempts_email_fingerprint_format",
      sql`${table.emailFingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "sign_in_attempts_ip_fingerprint_format",
      sql`${table.ipFingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    // The two window counts: WHERE <fingerprint> = ? AND created_at >= now() - window.
    index("sign_in_attempts_email_created_at_idx").on(
      table.emailFingerprint,
      table.createdAt.desc(),
    ),
    index("sign_in_attempts_ip_created_at_idx").on(
      table.ipFingerprint,
      table.createdAt.desc(),
    ),
  ],
);
