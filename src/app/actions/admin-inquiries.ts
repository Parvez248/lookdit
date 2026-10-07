"use server";

// Admin-only inquiry actions. Every export of a "use server" file is a
// POST-reachable endpoint, so each one checks the session itself first.

import { refresh } from "next/cache";

import { updateInquiryStatus } from "@/db/mutations/inquiries";
import { requireUser } from "@/lib/auth/session";
import { describeErrorForLog } from "@/lib/inquiries/submission";
import { isInquiryId, isInquiryStatus } from "@/lib/inquiries/status";

/**
 * Set an inquiry's status from a form with `id` and `status` fields. Signed-out
 * callers are redirected to sign-in; malformed input or an unknown id changes
 * nothing. The page re-renders with the stored status either way.
 */
export async function setInquiryStatus(formData: FormData): Promise<void> {
  await requireUser();
  if (!(formData instanceof FormData)) return;

  const id = formData.get("id");
  const status = formData.get("status");
  if (!isInquiryId(id) || !isInquiryStatus(status)) return;

  try {
    await updateInquiryStatus(id, status);
  } catch (error) {
    console.error("[admin] inquiry status update failed", { event: "error", ...describeErrorForLog(error) });
    throw new Error("The status couldn't be saved. Try again.");
  }
  refresh();
}
