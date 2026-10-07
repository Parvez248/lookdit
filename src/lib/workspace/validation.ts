import { z } from "zod";

import { isUuid } from "../uuid";
import { TASK_STATUSES } from "./status";

// Milestone and task form validation. Pure; the DB CHECKs and the same-project
// milestone FK are the backstop.

export const WORKSPACE_LIMITS = { milestoneTitle: 120, taskTitle: 200 } as const;

const hasNoNul = (value: string) => !value.includes("\u0000");

function title(max: number) {
  return z
    .string({ error: "Enter a title." })
    .trim()
    .min(1, "Enter a title.")
    .max(max, `Keep it under ${max} characters.`)
    .refine(hasNoNul, "The title contains an invalid character.");
}

/** `<input type="date">` sends `YYYY-MM-DD` or "". Real calendar dates only. */
const dueOn = z
  .string()
  .nullish()
  .transform((value) => value?.trim() || null)
  .refine((value) => value === null || isCalendarDate(value), "Enter a valid date.");

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** "" (no milestone) becomes null; anything else must be an id. */
const milestoneId = z
  .string()
  .nullish()
  .transform((value) => value || null)
  .refine((value) => value === null || isUuid(value), "Choose a milestone from the list.");

export const milestoneSchema = z.object({ title: title(WORKSPACE_LIMITS.milestoneTitle), dueOn });

export const newTaskSchema = z.object({ title: title(WORKSPACE_LIMITS.taskTitle), dueOn, milestoneId });

export const taskSchema = newTaskSchema.extend({
  status: z.enum(TASK_STATUSES, { error: "Choose a status." }),
});

export type MilestoneInput = z.output<typeof milestoneSchema>;
export type NewTaskInput = z.output<typeof newTaskSchema>;
export type TaskInput = z.output<typeof taskSchema>;

export type FieldErrors = Partial<Record<"title" | "dueOn" | "milestoneId" | "status", string>>;

type Result<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

function parse<T>(schema: z.ZodType<T>, fields: readonly string[], formData: FormData): Result<T> {
  const raw = Object.fromEntries(
    fields.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : undefined];
    }),
  );
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, value: parsed.data };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (field === "title" || field === "dueOn" || field === "milestoneId" || field === "status") {
      errors[field] ??= issue.message;
    }
  }
  return { ok: false, errors };
}

export const parseMilestoneForm = (formData: FormData) =>
  parse(milestoneSchema, ["title", "dueOn"], formData);

export const parseNewTaskForm = (formData: FormData) =>
  parse(newTaskSchema, ["title", "dueOn", "milestoneId"], formData);

export const parseTaskForm = (formData: FormData) =>
  parse(taskSchema, ["title", "dueOn", "milestoneId", "status"], formData);
