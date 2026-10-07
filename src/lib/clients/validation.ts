import { z } from "zod";

import { CLIENT_STATUSES } from "./status";

// Client form validation. Pure (no DB, no `server-only`), so it is unit-tested
// and shared by create and edit. Input comes from an admin, but a Server Action
// is still a public endpoint, so everything is checked here; the DB CHECKs are
// the backstop.

export const CLIENT_LIMITS = {
  name: 120,
  company: 160,
  email: 254,
  phone: 40,
  website: 2048,
  notes: 5000,
} as const;

export const CLIENT_FIELDS = ["name", "company", "email", "phone", "website", "notes", "status"] as const;
export type ClientField = (typeof CLIENT_FIELDS)[number];

// PostgreSQL `text` cannot store U+0000.
const hasNoNul = (value: string) => !value.includes("\u0000");

/** Optional text: trimmed; empty or missing becomes null so the DB never stores "". */
function optionalText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .refine(hasNoNul, `${label} contains an invalid character.`)
    .nullish()
    .transform((value) => value || null);
}

/** Adds https:// when no scheme is given, then accepts only http(s) URLs. */
function normalizeWebsite(value: string | null, ctx: z.RefinementCtx): string | null {
  if (value === null) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".")) return url.href;
  } catch {
    // Falls through to the issue below.
  }
  ctx.addIssue({ code: "custom", message: "Enter a website address, like example.com." });
  return z.NEVER;
}

export const clientSchema = z.object({
  name: z
    .string({ error: "Name is required." })
    .trim()
    .min(1, "Name is required.")
    .max(CLIENT_LIMITS.name, `Name must be at most ${CLIENT_LIMITS.name} characters.`)
    .refine(hasNoNul, "Name contains an invalid character."),
  company: optionalText(CLIENT_LIMITS.company, "Company"),
  email: optionalText(CLIENT_LIMITS.email, "Email")
    .transform((value) => value?.toLowerCase() ?? null)
    .refine((value) => value === null || z.email().safeParse(value).success, "Enter a valid email address."),
  phone: optionalText(CLIENT_LIMITS.phone, "Phone").refine(
    (value) => value === null || /^[+\d][\d\s().-]*$/.test(value),
    "Use digits, spaces and + ( ) - . only.",
  ),
  website: optionalText(CLIENT_LIMITS.website, "Website").transform(normalizeWebsite),
  notes: optionalText(CLIENT_LIMITS.notes, "Notes"),
  status: z.enum(CLIENT_STATUSES, { error: "Choose a status." }),
});

export type ClientInput = z.output<typeof clientSchema>;
export type ClientFieldErrors = Partial<Record<ClientField, string>>;

export type ClientValidationResult =
  | { ok: true; value: ClientInput }
  | { ok: false; errors: ClientFieldErrors };

/** Validate the client form. Only the known fields are read from FormData. */
export function parseClientForm(formData: FormData): ClientValidationResult {
  const raw = Object.fromEntries(
    CLIENT_FIELDS.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : undefined];
    }),
  );
  const parsed = clientSchema.safeParse(raw);
  if (parsed.success) return { ok: true, value: parsed.data };

  const errors: ClientFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && (CLIENT_FIELDS as readonly string[]).includes(field)) {
      errors[field as ClientField] ??= issue.message;
    }
  }
  return { ok: false, errors };
}
