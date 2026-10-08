import { z } from "zod";

import { isUuid } from "../uuid";
import { PROJECT_CATEGORIES, WORK_STATUSES } from "./status";

// Project form validation. Pure (no DB, no `server-only`), shared by create and
// edit. A Server Action is a public endpoint, so everything is checked here;
// the DB CHECKs and the client FK are the backstop.

export const PROJECT_LIMITS = {
  title: 120,
  summary: 300,
  client: 120,
  liveUrl: 2048,
  seoTitle: 70,
  seoDescription: 160,
  metrics: 6,
  metricValue: 24,
  metricLabel: 60,
} as const;

/** Must match `projects_year_range`. */
export const PROJECT_YEAR_MIN = 2000;
export const PROJECT_YEAR_MAX = 2100;

export const PROJECT_FIELDS = [
  "title",
  "clientId",
  "workStatus",
  "category",
  "year",
  "summary",
  // Public case-study fields: shown on /work only once the project is published.
  "client",
  "liveUrl",
  "featured",
  "metrics",
  "seoTitle",
  "seoDescription",
] as const;
export type ProjectField = (typeof PROJECT_FIELDS)[number];

// PostgreSQL `text` cannot store U+0000.
const hasNoNul = (value: string) => !value.includes("\u0000");

/** Optional free text: blank becomes null, so the DB never stores "". */
function optionalText(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .refine(hasNoNul, `${label} contains an invalid character.`)
    .nullish()
    .transform((value) => value || null);
}

/**
 * Only absolute http(s) URLs. The live URL is rendered as a public link, so any
 * other scheme (javascript:, data:, …) is rejected here, not just escaped later.
 */
export function isHttpUrl(value: string): boolean {
  if (/\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export type ProjectMetric = { label: string; value: string };

/**
 * The results textarea: one metric per line as `Value | Label`, for example
 * `2× | Faster checkout`. Blank lines are ignored; no lines means no metrics.
 */
export function parseMetricsText(
  text: string,
): { ok: true; value: ProjectMetric[] | null } | { ok: false; error: string } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  if (lines.length === 0) return { ok: true, value: null };
  if (lines.length > PROJECT_LIMITS.metrics) {
    return { ok: false, error: `Add at most ${PROJECT_LIMITS.metrics} results.` };
  }

  const metrics: ProjectMetric[] = [];
  for (const [index, line] of lines.entries()) {
    const separator = line.indexOf("|");
    const value = separator === -1 ? "" : line.slice(0, separator).trim();
    const label = separator === -1 ? "" : line.slice(separator + 1).trim();
    const where = `Line ${index + 1}`;
    if (value === "" || label === "") return { ok: false, error: `${where}: write it as Value | Label.` };
    if (value.length > PROJECT_LIMITS.metricValue) {
      return { ok: false, error: `${where}: the value must be at most ${PROJECT_LIMITS.metricValue} characters.` };
    }
    if (label.length > PROJECT_LIMITS.metricLabel) {
      return { ok: false, error: `${where}: the label must be at most ${PROJECT_LIMITS.metricLabel} characters.` };
    }
    if (!hasNoNul(line)) return { ok: false, error: `${where} contains an invalid character.` };
    metrics.push({ label, value });
  }
  return { ok: true, value: metrics };
}

/** The stored metrics back in textarea form, for the edit page. */
export function formatMetricsText(metrics: readonly ProjectMetric[] | null): string {
  return (metrics ?? []).map((metric) => `${metric.value} | ${metric.label}`).join("\n");
}

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
  // Public display name. Never derived from clientId: blank keeps the client private.
  client: optionalText("Client name", PROJECT_LIMITS.client),
  liveUrl: optionalText("Live site", PROJECT_LIMITS.liveUrl).refine(
    (value) => value === null || isHttpUrl(value),
    "Enter a full web address starting with https://",
  ),
  // A checkbox posts "on" when ticked and nothing when not.
  featured: z
    .string()
    .nullish()
    .transform((value) => value === "on"),
  metrics: z
    .string()
    .nullish()
    .transform((value) => value ?? "")
    .superRefine((text, ctx) => {
      const parsed = parseMetricsText(text);
      if (!parsed.ok) ctx.addIssue({ code: "custom", message: parsed.error });
    })
    .transform((text) => {
      const parsed = parseMetricsText(text);
      return parsed.ok ? parsed.value : null;
    }),
  seoTitle: optionalText("SEO title", PROJECT_LIMITS.seoTitle),
  seoDescription: optionalText("SEO description", PROJECT_LIMITS.seoDescription),
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
