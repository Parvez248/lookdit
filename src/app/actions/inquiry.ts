"use server";

// Public boundary for the future contact form. Every export of a "use server"
// file becomes a POST-reachable endpoint, so this file exports ONLY
// `submitInquiry`. The trusted `createInquiry` stays in its server-only module and
// is never re-exported here.

import { headers } from "next/headers";

import { createInquiry } from "@/db/mutations/inquiries";
import { computeClientFingerprint } from "@/lib/inquiries/client-fingerprint";
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
 * - No trusted client IP, or HMAC secret missing/invalid → generic `error`, no
 *   DB call (fail closed).
 * - Invalid input → `invalid` with per-field messages.
 * - Over the per-client limit → `rate_limited`; nothing inserted.
 * - Unexpected/DB failure → generic `error`; only log-safe metadata is logged.
 *
 * Logs carry fixed event names only: never the IP, client key, fingerprint,
 * secret or any submitted value.
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

  const client = computeClientFingerprint(await headers(), process.env);
  if (!client.ok) {
    console.error("[inquiry] submission refused", { event: client.reason });
    return { status: "error", message: GENERIC_SUBMIT_ERROR_MESSAGE };
  }

  try {
    const result = await createInquiry(pickInquiryFields(formData), {
      ipFingerprint: client.fingerprint,
    });
    if (!result.ok && "rateLimited" in result) {
      console.warn("[inquiry] submission rate limited", { event: "rate_limited" });
    }
    return toSubmitInquiryState(result);
  } catch (error) {
    console.error("[inquiry] submission failed", describeErrorForLog(error));
    return { status: "error", message: GENERIC_SUBMIT_ERROR_MESSAGE };
  }
}
