import { z } from "zod";

// Public inquiry validation boundary. Pure and side-effect free (no DB, no
// `server-only`), so it can be unit-tested and reused by any server entry point.
// Input is untrusted: only the four public fields are accepted, and any other
// key (status, id, timestamps, ipFingerprint, …) rejects the whole input.

export const INQUIRY_LIMITS = {
  name: 120,
  email: 254,
  company: 160,
  message: 5000,
} as const;

// PostgreSQL `text` cannot store U+0000, so reject it here as a validation
// failure instead of letting the INSERT throw.
const hasNoNul = (value: string) => !value.includes("\u0000");

// All length limits apply AFTER trimming.
export const publicInquirySchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(INQUIRY_LIMITS.name, `Name must be at most ${INQUIRY_LIMITS.name} characters.`)
    .refine(hasNoNul, "Name contains an invalid character."),
  // Trim + lowercase first, then check length, then syntax. The syntax check is a
  // separate piped schema because zod's email format check would otherwise run
  // against the untrimmed value.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required.")
    .max(INQUIRY_LIMITS.email, `Email must be at most ${INQUIRY_LIMITS.email} characters.`)
    .pipe(z.email("Enter a valid email address.")),
  // Optional. Missing, null, empty and whitespace-only all normalize to null so
  // the DB never stores "" for "no company".
  company: z
    .string()
    .trim()
    .max(INQUIRY_LIMITS.company, `Company must be at most ${INQUIRY_LIMITS.company} characters.`)
    .refine(hasNoNul, "Company contains an invalid character.")
    .nullish()
    .transform((value) => value || null),
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(INQUIRY_LIMITS.message, `Message must be at most ${INQUIRY_LIMITS.message} characters.`)
    .refine(hasNoNul, "Message contains an invalid character."),
});

/** Validated, normalized public inquiry — the only shape the insert path accepts. */
export type NormalizedInquiryInput = z.output<typeof publicInquirySchema>;

/**
 * A single validation problem. `field` is the top-level input key it refers to,
 * or null when the input as a whole is wrong (e.g. not an object). Messages never
 * echo submitted values.
 */
export type InquiryValidationIssue = {
  field: string | null;
  code: string;
  message: string;
};

export type InquiryValidationResult =
  | { ok: true; value: NormalizedInquiryInput }
  | { ok: false; issues: InquiryValidationIssue[] };

/**
 * Validate and normalize untrusted public inquiry input. Bad input is an expected
 * outcome, so it returns `{ ok: false, issues }` instead of throwing.
 */
export function validateInquiryInput(input: unknown): InquiryValidationResult {
  const parsed = publicInquirySchema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, issues: parsed.error.issues.flatMap(toValidationIssues) };
}

function toValidationIssues(issue: z.core.$ZodIssue): InquiryValidationIssue[] {
  // zod reports all unknown keys in one root-level issue; split it per key so
  // each rejected field is reported individually.
  if (issue.code === "unrecognized_keys") {
    return issue.keys.map((key) => ({
      field: key,
      code: "unrecognized_key",
      message: "This field is not allowed.",
    }));
  }
  const [first] = issue.path;
  return [
    {
      field: first === undefined ? null : String(first),
      code: issue.code,
      message: issue.message,
    },
  ];
}
