import { describe, expect, it } from "vitest";

import { formatDueDate, isOverdue, nextMilestone, progressOf, todayUtc } from "./progress";
import { NEXT_TASK_STEP } from "./status";
import { parseMilestoneForm, parseNewTaskForm, parseTaskForm } from "./validation";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const MILESTONE_ID = "0199e000-0000-7000-8000-000000000001";

describe("workspace forms", () => {
  it("normalizes a new task", () => {
    expect(parseNewTaskForm(form({ title: "  Write copy ", dueOn: "", milestoneId: MILESTONE_ID, status: "done" }))).toEqual({
      ok: true,
      value: { title: "Write copy", dueOn: null, milestoneId: MILESTONE_ID },
    });
  });

  it("rejects blank titles, impossible dates and foreign ids", () => {
    const result = parseNewTaskForm(form({ title: " ", dueOn: "2026-02-30", milestoneId: "x" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["dueOn", "milestoneId", "title"]);
  });

  it("checks title lengths", () => {
    expect(parseMilestoneForm(form({ title: "x".repeat(121) })).ok).toBe(false);
    expect(parseMilestoneForm(form({ title: "x".repeat(120), dueOn: "2026-10-14" })).ok).toBe(true);
    expect(parseNewTaskForm(form({ title: "x".repeat(201) })).ok).toBe(false);
  });

  it("requires a known status when editing a task", () => {
    expect(parseTaskForm(form({ title: "T", status: "blocked" })).ok).toBe(false);
    expect(parseTaskForm(form({ title: "T", status: "doing" }))).toMatchObject({ ok: true, value: { status: "doing" } });
  });
});

describe("progress", () => {
  it("counts done tasks", () => {
    expect(progressOf([])).toEqual({ done: 0, total: 0, percent: 0 });
    expect(progressOf([{ status: "done" }, { status: "doing" }, { status: "todo" }])).toEqual({
      done: 1,
      total: 3,
      percent: 33,
    });
  });

  it("marks only unfinished past-due items overdue", () => {
    expect(isOverdue("2026-10-06", "2026-10-07", false)).toBe(true);
    expect(isOverdue("2026-10-07", "2026-10-07", false)).toBe(false);
    expect(isOverdue("2026-10-06", "2026-10-07", true)).toBe(false);
    expect(isOverdue(null, "2026-10-07", false)).toBe(false);
  });

  it("formats due dates in UTC", () => {
    expect(todayUtc(new Date("2026-10-07T23:30:00Z"))).toBe("2026-10-07");
    expect(formatDueDate("2026-10-14", "2026-10-07")).toBe("14 Oct");
    expect(formatDueDate("2027-01-02", "2026-10-07")).toBe("2 Jan 2027");
  });

  it("picks the next open milestone", () => {
    const done = { dueOn: "2026-10-01", completedAt: new Date() };
    const undated = { dueOn: null, completedAt: null };
    const dated = { dueOn: "2026-10-20", completedAt: null };
    expect(nextMilestone([done, dated, undated])).toBe(dated);
    expect(nextMilestone([done, undated])).toBe(undated);
    expect(nextMilestone([done])).toBeNull();
  });

  it("cycles task steps", () => {
    expect(NEXT_TASK_STEP.todo.status).toBe("doing");
    expect(NEXT_TASK_STEP.doing.status).toBe("done");
    expect(NEXT_TASK_STEP.done.status).toBe("todo");
  });
});
