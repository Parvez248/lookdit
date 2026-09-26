"use server";

// Public boundary for the future contact form. Every export of a "use server"
// file becomes a POST-reachable endpoint, so this file exports ONLY
// `submitInquiry`. The trusted `createInquiry` stays in its server-only module and
// is never re-exported here.

import { createInquiry } from "@/db/mutations/inquiries";
import {
  describeErrorForLog,
  GENERIC_SUBMIT_ERROR_MESSAGE,
  isHoneypotFilled,
  pickInquiryFields,
  type SubmitInquiryState,
  toSubmitInquiryState,
} from "@/lib/inquiries/submission";

/**
 * Submit a public inquiry. Signature matches `useActionState`.
 *
 * - Honeypot filled → silent success, no DB call.
 * - Invalid input → `invalid` with per-field messages.
 * - Unexpected/DB failure → generic `error`; only log-safe metadata is logged.
 *
 * No `ipFingerprint` is passed yet (IP extraction, HMAC and rate limiting ship in
 * feat/inquiry-abuse-protection, which must land before the form is public).
 */
export async function submitInquiry(
  _previousState: SubmitInquiryState,
  formData: FormData,
): Promise<SubmitInquiryState> {
  // Arguments come from the network: a crafted request can send anything.
  if (!(formData instanceof FormData)) {
    return { status: "error", message: GENERIC_SUBMIT_ERROR_MESSAGE };
  }

  if (isHoneypotFilled(formData)) {
    return { status: "success" };
  }

  try {
    const result = await createInquiry(pickInquiryFields(formData));
    return toSubmitInquiryState(result);
  } catch (error) {
    console.error("[inquiry] submission failed", describeErrorForLog(error));
    return { status: "error", message: GENERIC_SUBMIT_ERROR_MESSAGE };
  }
}
