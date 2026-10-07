import type { TaskStatus } from "./status";

// Progress and due-date helpers for the project workspace. Pure: "today" is
// passed in, so the overdue rule is testable and the same for every row.

export type Progress = { done: number; total: number; percent: number };

export function progressOf(tasks: readonly { status: TaskStatus }[]): Progress {
  const done = tasks.filter((task) => task.status === "done").length;
  const total = tasks.length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** Today's date in UTC as `YYYY-MM-DD`, the same form as a `date` column. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Overdue: has a due date before today and isn't finished. ISO dates compare as text. */
export function isOverdue(dueOn: string | null, today: string, finished: boolean): boolean {
  return dueOn !== null && !finished && dueOn < today;
}

const dueFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dueFormatWithYear = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "14 Oct", or "14 Oct 2027" when the year differs from today's. */
export function formatDueDate(dueOn: string, today: string): string {
  const date = new Date(`${dueOn}T00:00:00Z`);
  return (dueOn.slice(0, 4) === today.slice(0, 4) ? dueFormat : dueFormatWithYear).format(date);
}

/**
 * The milestone to show as "next": the first open one with a due date (the
 * list is already ordered by due date), else the first open one.
 */
export function nextMilestone<T extends { dueOn: string | null; completedAt: Date | null }>(
  milestones: readonly T[],
): T | null {
  const open = milestones.filter((milestone) => milestone.completedAt === null);
  return open.find((milestone) => milestone.dueOn !== null) ?? open[0] ?? null;
}
