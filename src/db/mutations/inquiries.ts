import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { inquiries } from "@/db/schema";
import {
  type InquiryValidationIssue,
  type NormalizedInquiryInput,
  validateInquiryInput,
} from "@/lib/inquiries/validation";

/** Server-generated values that must never come from public input. */
export type TrustedInquiryOptions = {
  /**
   * HMAC-SHA-256 fingerprint of the trusted client key (64 lowercase hex). Never a
   * raw IP. Required: every public insert is rate-limited per fingerprint.
   */
  ipFingerprint: string;
};

/** Per-fingerprint limit on successful inquiries (rolling window, DB clock). */
export const INQUIRY_RATE_LIMIT = {
  maxPerWindow: 5,
  windowSeconds: 60 * 60,
} as const;

/** Minimal safe result: never echoes the submitted email or message back. */
export type CreatedInquiry = {
  id: string;
  createdAt: Date;
};

export type CreateInquiryResult =
  | { ok: true; value: CreatedInquiry }
  | { ok: false; issues: InquiryValidationIssue[] }
  | { ok: false; rateLimited: true };

const IP_FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Public inquiry creation. Validates the untrusted input itself, so a caller that
 * forgets to validate first can never insert unvalidated data.
 *
 * - Invalid public input → `{ ok: false, issues }` (expected, not an exception).
 * - Fingerprint over its limit → `{ ok: false, rateLimited: true }` (nothing inserted).
 * - Malformed trusted options or DB/operational failures → thrown errors, never
 *   disguised as validation issues.
 */
export async function createInquiry(
  input: unknown,
  options: TrustedInquiryOptions,
): Promise<CreateInquiryResult> {
  const { ipFingerprint } = options;
  // A bad fingerprint is a server bug, not a visitor mistake. Fail loudly, without
  // echoing the value. (The DB CHECK constraint is the backstop.)
  if (typeof ipFingerprint !== "string" || !IP_FINGERPRINT_PATTERN.test(ipFingerprint)) {
    throw new TypeError("ipFingerprint must be 64 lowercase hex characters.");
  }

  // Validate before any DB work: invalid input never costs a query.
  const validated = validateInquiryInput(input);
  if (!validated.ok) return validated;

  const created = await insertInquiryWithinRateLimit(validated.value, ipFingerprint);
  return created === null ? { ok: false, rateLimited: true } : { ok: true, value: created };
}

/** Namespaces this feature's advisory locks within the database-wide key space. */
const RATE_LIMIT_LOCK_NAMESPACE = "lookdit:inquiry-rate-limit:";

/**
 * Internal insert, atomic with its per-fingerprint rate-limit check. Returns null
 * when the fingerprint is at its limit (nothing inserted).
 *
 * Both statements run in ONE non-interactive transaction (neon-http `batch`, one
 * HTTP request):
 * 1. `pg_advisory_xact_lock` on this fingerprint serializes concurrent inserts
 *    for the same client only; it is released at COMMIT/ROLLBACK.
 * 2. The conditional INSERT runs as a separate statement, so under READ COMMITTED
 *    it takes a fresh snapshot AFTER the lock is granted and sees every row the
 *    previous lock holder committed. (A single statement would not: its snapshot
 *    predates the lock wait.)
 *
 * The count uses the partial index (ip_fingerprint, created_at DESC). The window
 * uses the DB clock only. Columns are listed explicitly and status is always
 * 'new' on the public path.
 */
async function insertInquiryWithinRateLimit(
  input: NormalizedInquiryInput,
  ipFingerprint: string,
): Promise<CreatedInquiry | null> {
  const { maxPerWindow, windowSeconds } = INQUIRY_RATE_LIMIT;
  const column = (name: string) => sql.identifier(name);

  const [, insertResult] = await db.batch([
    db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${RATE_LIMIT_LOCK_NAMESPACE + ipFingerprint}, 0))`,
    ),
    db.execute<{ id: string; created_at: string }>(sql`
      insert into ${inquiries} (
        ${column(inquiries.name.name)}, ${column(inquiries.email.name)},
        ${column(inquiries.company.name)}, ${column(inquiries.message.name)},
        ${column(inquiries.status.name)}, ${column(inquiries.ipFingerprint.name)}
      )
      select ${input.name}, ${input.email}, ${input.company}, ${input.message}, 'new', ${ipFingerprint}
      where (
        select count(*) from ${inquiries}
        where ${inquiries.ipFingerprint} = ${ipFingerprint}
          and ${inquiries.createdAt} >= now() - make_interval(secs => ${windowSeconds})
      ) < ${maxPerWindow}
      returning ${column(inquiries.id.name)}, ${column(inquiries.createdAt.name)}
    `),
  ]);

  const row = insertResult.rows[0];
  if (!row) return null;
  // Raw results skip drizzle's column mapping; neon-http returns timestamptz as
  // text, which drizzle's own timestamptz mapper also parses with `new Date`.
  return { id: row.id, createdAt: new Date(row.created_at) };
}
