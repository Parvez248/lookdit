import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Inquiries — public contact / project-inquiry submissions (private data).
 * Public INSERT (validated + rate-limited at the app layer); admin reads/updates
 * status. Spam is a status value, not a separate flag.
 */
export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    message: text("message").notNull(),
    status: text("status").notNull().default("new"),
    // PRIVACY / SECURITY CONTRACT for ip_fingerprint:
    // - NEVER store the raw visitor IP.
    // - NEVER store a plain/unsalted hash of the IP.
    // - Produced server-side as HMAC-SHA-256(secret, normalized IP); the HMAC
    //   secret stays in server environment variables and is never stored here.
    // - This column holds ONLY the resulting fingerprint (64 lowercase hex).
    // - Intended for abuse / rate-limit analysis, NOT user identity.
    ipFingerprint: text("ip_fingerprint"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Not auto-updated at the DB level; mutation code sets it (no trigger yet).
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Controlled status vocabulary (text + CHECK, not a pg enum).
    check(
      "inquiries_status_allowed",
      sql`${table.status} IN ('new', 'reviewing', 'replied', 'closed', 'spam')`,
    ),
    // Non-blank text (after trimming). Full email syntax is validated in the app.
    check("inquiries_name_not_blank", sql`length(btrim(${table.name})) > 0`),
    check("inquiries_email_not_blank", sql`length(btrim(${table.email})) > 0`),
    check(
      "inquiries_message_not_blank",
      sql`length(btrim(${table.message})) > 0`,
    ),
    // When present, ip_fingerprint must be a 64-char lowercase hex SHA-256 HMAC.
    check(
      "inquiries_ip_fingerprint_format",
      sql`${table.ipFingerprint} IS NULL OR ${table.ipFingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    // Default admin inbox: newest-first listing.
    index("inquiries_created_at_idx").on(table.createdAt.desc()),
    // Admin filtering by status while keeping newest-first order.
    index("inquiries_status_created_at_idx").on(
      table.status,
      table.createdAt.desc(),
    ),
    // Future abuse / rate-limit queries: WHERE ip_fingerprint = ? AND created_at >= ?
    // Partial — only fingerprinted rows participate.
    index("inquiries_ip_fingerprint_created_at_idx")
      .on(table.ipFingerprint, table.createdAt.desc())
      .where(sql`${table.ipFingerprint} IS NOT NULL`),
  ],
);
