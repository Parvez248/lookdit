import { isUuid } from "../uuid";

// Task statuses and the one-click step each row offers. Pure. Must match the
// `project_tasks_status_allowed` CHECK.

export const TASK_STATUSES = ["todo", "doing", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  doing: "In progress",
  done: "Done",
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (TASK_STATUSES as readonly string[]).includes(value);
}

/** The row button: To do → Start, In progress → Done, Done → Reopen. */
export const NEXT_TASK_STEP: Record<TaskStatus, { status: TaskStatus; label: string }> = {
  todo: { status: "doing", label: "Start" },
  doing: { status: "done", label: "Done" },
  done: { status: "todo", label: "Reopen" },
};

/** Milestone and task ids are UUIDs. */
export const isWorkspaceId = isUuid;
