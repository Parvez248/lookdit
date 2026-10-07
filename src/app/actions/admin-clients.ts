"use server";

// Admin-only client actions. Every export of a "use server" file is a
// POST-reachable endpoint, so each one checks the session itself first.

import { redirect } from "next/navigation";

import { createClient, createClientFromInquiry, updateClient } from "@/db/mutations/clients";
import { getInquiry } from "@/db/queries/inquiries";
import { requireUser } from "@/lib/auth/session";
import type { ClientFormState } from "@/lib/clients/form-state";
import { isClientId } from "@/lib/clients/status";
import { CLIENT_FIELDS, parseClientForm } from "@/lib/clients/validation";
import { describeErrorForLog } from "@/lib/inquiries/submission";
import { isInquiryId } from "@/lib/inquiries/status";

/** What the admin typed, so the form can be re-filled after an error. */
function submittedValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    CLIENT_FIELDS.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value.slice(0, 6000) : ""];
    }),
  );
}

/**
 * Create a client, or update one when the form carries an `id`. Signature
 * matches `useActionState`. Success redirects to the client's page; invalid
 * input returns per-field messages; an unknown id is treated as not found.
 */
export async function saveClient(_previous: ClientFormState, formData: FormData): Promise<ClientFormState> {
  await requireUser();
  if (!(formData instanceof FormData)) {
    return { status: "error", message: "The form couldn't be read. Try again.", values: {} };
  }

  const values = submittedValues(formData);
  const parsed = parseClientForm(formData);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors, values };

  // No id: create. A valid id: update. Anything else: not a client we know.
  const rawId = formData.get("id");
  const id = rawId === null || rawId === "" ? null : isClientId(rawId) ? rawId : undefined;
  if (id === undefined) redirect("/admin/clients");

  let savedId: string | null;
  try {
    savedId = id === null ? await createClient(parsed.value) : (await updateClient(id, parsed.value)) ? id : null;
  } catch (error) {
    console.error("[admin] client save failed", { event: "error", ...describeErrorForLog(error) });
    return { status: "error", message: "The client couldn't be saved. Try again.", values };
  }

  // Outside the try: redirect() works by throwing. A null id means the client
  // was deleted or never existed.
  if (savedId === null) redirect("/admin/clients");
  redirect(`/admin/clients/${savedId}`);
}

/**
 * "Make client" on an inquiry: create a lead from it and open the new client.
 * If the inquiry is already linked (or a double click got there first), open
 * the linked client instead.
 */
export async function makeClientFromInquiry(formData: FormData): Promise<void> {
  await requireUser();
  if (!(formData instanceof FormData)) return;
  const inquiryId = formData.get("inquiryId");
  if (!isInquiryId(inquiryId)) return;

  let clientId: string | null;
  try {
    clientId = await createClientFromInquiry(inquiryId);
    clientId ??= (await getInquiry(inquiryId))?.clientId ?? null;
  } catch (error) {
    console.error("[admin] make client failed", { event: "error", ...describeErrorForLog(error) });
    throw new Error("The client couldn't be created. Try again.");
  }
  redirect(clientId ? `/admin/clients/${clientId}` : "/admin/inquiries");
}
