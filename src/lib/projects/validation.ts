import { z } from "zod";

import { isUuid } from "../uuid";
import { PROJECT_CATEGORIES, WORK_STATUSES } from "./status";

// Project form validation. Pure (no DB, no `server-only`), shared by create and
// edit. A Server Action is a public endpoint, so everything is checked here;
// the DB CHECKs and the client FK are the backstop.

export const PROJECT_LIMITS = {
  title: 120,
  summary: 300,
} as const;

/** Must match `projects_year_range`. */
export const PROJECT_YEAR_MIN = 2000;
export const PROJECT_YEAR_MAX = 2100;

export const PROJECT_FIELDS = ["title", "clientId", "workStatus", "category", "year", "summary"] as const;
export type ProjectField = (typeof PROJECT_FIELDS)[number];

// PostgreSQL `text` cannot store U+0000.
const hasNoNul = (value: string) => !value.includes("\u0000");

export const projectSchema = z.object({
  title: z
    .string({ error: "Title is required." })
    .trim()
    .min(1, "Title is required.")
    .max(PROJECT_LIMITS.title, `Title must be at most ${PROJECT_LIMITS.title} characters.`)
    .refine(hasNoNul, "Title contains an invalid character."),
  // "" (no client chosen) becomes null; anything else must be a client id.
  clientId: z
    .string()
    .nullish()
    .transform((value) => value || null)
    .refine((value) => value === null || isUuid(value), "Choose a client from the list."),
  workStatus: z.enum(WORK_STATUSES, { error: "Choose a status." }),
  category: z.enum(PROJECT_CATEGORIES, { error: "Choose a category." }),
  year: z
    .string({ error: "Year is required." })
    .trim()
    .regex(/^\d{4}$/, "Enter a four-digit year.")
    .transform(Number)
    .refine(
      (value) => value >= PROJECT_YEAR_MIN && value <= PROJECT_YEAR_MAX,
      `Enter a year between ${PROJECT_YEAR_MIN} and ${PROJECT_YEAR_MAX}.`,
    ),
  summary: z
    .string({ error: "Summary is required." })
    .trim()
    .min(1, "Summary is required.")
    .max(PROJECT_LIMITS.summary, `Summary must be at most ${PROJECT_LIMITS.summary} characters.`)
    .refine(hasNoNul, "Summary contains an invalid character."),
});

export type ProjectInput = z.output<typeof projectSchema>;
export type ProjectFieldErrors = Partial<Record<ProjectField, string>>;

export type ProjectValidationResult =
  | { ok: true; value: ProjectInput }
  | { ok: false; errors: ProjectFieldErrors };

/** Validate the project form. Only the known fields are read from FormData. */
export function parseProjectForm(formData: FormData): ProjectValidationResult {
  const raw = Object.fromEntries(
    PROJECT_FIELDS.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : undefined];
    }),
  );
  const parsed = projectSchema.safeParse(raw);
  if (parsed.success) return { ok: true, value: parsed.data };

  const errors: ProjectFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && (PROJECT_FIELDS as readonly string[]).includes(field)) {
      errors[field as ProjectField] ??= issue.message;
    }
  }
  return { ok: false, errors };
}
