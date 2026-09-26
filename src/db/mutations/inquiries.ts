import "server-only";

import { db } from "@/db";
import { inquiries } from "@/db/schema";
import {
  type InquiryValidationIssue,
  type NormalizedInquiryInput,
  validateInquiryInput,
} from "@/lib/inquiries/validation";

/** Server-generated values that must never come from public input. */
export type TrustedInquiryOptions = {
  /** HMAC-SHA-256 fingerprint of the visitor IP (64 lowercase hex). Never a raw IP. */
  ipFingerprint?: string;
};

/** Minimal safe result: never echoes the submitted email or message back. */
export type CreatedInquiry = {
  id: string;
  createdAt: Date;
};

export type CreateInquiryResult =
  | { ok: true; value: CreatedInquiry }
  | { ok: false; issues: InquiryValidationIssue[] };

const IP_FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Public inquiry creation. Validates the untrusted input itself, so a caller that
 * forgets to validate first can never insert unvalidated data.
 *
 * - Invalid public input → `{ ok: false, issues }` (expected, not an exception).
 * - Malformed trusted options or DB/operational failures → thrown errors, never
 *   disguised as validation issues.
 */
export async function createInquiry(
  input: unknown,
  options: TrustedInquiryOptions = {},
): Promise<CreateInquiryResult> {
  const { ipFingerprint } = options;
  // A bad fingerprint is a server bug, not a visitor mistake. Fail loudly, without
  // echoing the value. (The DB CHECK constraint is the backstop.)
  if (ipFingerprint !== undefined && !IP_FINGERPRINT_PATTERN.test(ipFingerprint)) {
    throw new TypeError("ipFingerprint must be 64 lowercase hex characters.");
  }

  const validated = validateInquiryInput(input);
  if (!validated.ok) return validated;

  const created = await insertInquiry(validated.value, ipFingerprint ?? null);
  return { ok: true, value: created };
}

/**
 * Internal insert. Only accepts already-normalized input. Columns are listed
 * explicitly (no spreading) so nothing beyond the approved fields can reach the
 * row, and status is always 'new' on the public creation path.
 */
async function insertInquiry(
  input: NormalizedInquiryInput,
  ipFingerprint: string | null,
): Promise<CreatedInquiry> {
  const [row] = await db
    .insert(inquiries)
    .values({
      name: input.name,
      email: input.email,
      company: input.company,
      message: input.message,
      status: "new",
      ipFingerprint,
    })
    .returning({ id: inquiries.id, createdAt: inquiries.createdAt });

  if (!row) {
    throw new Error("Inquiry insert returned no row.");
  }
  return row;
}
