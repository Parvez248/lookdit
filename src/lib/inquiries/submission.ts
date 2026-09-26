import type { InquiryValidationIssue } from "./validation";

// Pure helpers for the public inquiry form boundary (the `submitInquiry` Server
// Action). No DB and no `server-only`, so they are unit-testable in isolation and
// the result types can be imported by the future Client Component form.

/** The only form fields ever forwarded to `createInquiry`. */
export const INQUIRY_FORM_FIELDS = ["name", "email", "company", "message"] as const;

export type InquiryFormField = (typeof INQUIRY_FORM_FIELDS)[number];

/**
 * Hidden anti-spam field. Real visitors never see or fill it; bots that fill
 * every input do. A deliberately non-standard name keeps browser autofill away.
 */
export const INQUIRY_HONEYPOT_FIELD = "company_website";

export const GENERIC_SUBMIT_ERROR_MESSAGE = "Something went wrong. Please try again.";

export const RATE_LIMITED_SUBMIT_MESSAGE =
  "You've sent several messages recently. Please try again later.";

/**
 * Result contract for the future form (`useActionState`). Never carries the
 * inquiry id, timestamps, or any submitted value.
 */
export type SubmitInquiryState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "invalid"; fieldErrors: Partial<Record<InquiryFormField, string>> }
  | { status: "rate_limited"; message: string }
  | { status: "error"; message: string };

export const INITIAL_SUBMIT_INQUIRY_STATE: SubmitInquiryState = { status: "idle" };

/**
 * Explicitly pick the four public fields. Anything else in the FormData (Next's
 * `$ACTION_*` keys, the honeypot, or injected keys such as `status` or
 * `ipFingerprint`) is ignored and never reaches `createInquiry`. Values are
 * passed through untouched: missing fields are `null` and file uploads are
 * `File`, both of which the strict schema rejects.
 */
export function pickInquiryFields(
  formData: FormData,
): Record<InquiryFormField, FormDataEntryValue | null> {
  return {
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    message: formData.get("message"),
  };
}

/** True when the honeypot field carries anything other than empty/whitespace. */
export function isHoneypotFilled(formData: FormData): boolean {
  const value = formData.get(INQUIRY_HONEYPOT_FIELD);
  if (value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true; // A file in a text honeypot is never a real visitor.
}

function isInquiryFormField(field: string | null): field is InquiryFormField {
  return (INQUIRY_FORM_FIELDS as readonly (string | null)[]).includes(field);
}

/**
 * Map a `createInquiry` result to the frontend-safe state. Success deliberately
 * drops the created id/timestamp. A rate-limited result gets a fixed message.
 * Validation issues become at most one message per field (the first one); issue
 * messages never contain submitted values.
 */
export function toSubmitInquiryState(
  result:
    | { ok: true }
    | { ok: false; issues: readonly InquiryValidationIssue[] }
    | { ok: false; rateLimited: true },
): SubmitInquiryState {
  if (result.ok) return { status: "success" };
  if ("rateLimited" in result) {
    return { status: "rate_limited", message: RATE_LIMITED_SUBMIT_MESSAGE };
  }

  const fieldErrors: Partial<Record<InquiryFormField, string>> = {};
  for (const issue of result.issues) {
    if (isInquiryFormField(issue.field) && fieldErrors[issue.field] === undefined) {
      fieldErrors[issue.field] = issue.message;
    }
  }
  // Only whole-input issues (impossible after `pickInquiryFields`) would leave
  // this empty; don't show the user an "invalid" state with nothing to fix.
  if (Object.keys(fieldErrors).length === 0) {
    return { status: "error", message: GENERIC_SUBMIT_ERROR_MESSAGE };
  }
  return { status: "invalid", fieldErrors };
}

const SQLSTATE_PATTERN = /^[0-9A-Z]{5}$/;

function sqlStateOf(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("code" in value)) return undefined;
  const { code } = value;
  return typeof code === "string" && SQLSTATE_PATTERN.test(code) ? code : undefined;
}

/**
 * Log-safe description of an unexpected failure: the error type and, when
 * present, the PostgreSQL SQLSTATE code. Never the message: Drizzle's
 * `DrizzleQueryError` message embeds the query params (the inquiry values), and
 * PostgreSQL constraint errors echo the failing row.
 */
export function describeErrorForLog(error: unknown): { type: string; code?: string } {
  const type = error instanceof Error ? error.name : typeof error;
  const cause = error instanceof Error ? error.cause : undefined;
  const code = sqlStateOf(error) ?? sqlStateOf(cause);
  return code === undefined ? { type } : { type, code };
}
