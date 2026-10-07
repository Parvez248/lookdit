"use server";

// Admin-only milestone and task actions. Every export of a "use server" file is
// a POST-reachable endpoint, so each one checks the session itself first, and
// every write is scoped to the project id in the form (see the mutations).

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import {
  createMilestone,
  createTask,
  deleteMilestone,
  deleteTask,
  setMilestoneCompleted,
  setTaskStatus,
  updateMilestone,
  updateTask,
} from "@/db/mutations/project-workspace";
import { requireUser } from "@/lib/auth/session";
import { describeErrorForLog } from "@/lib/inquiries/submission";
import { isProjectId } from "@/lib/projects/status";
import type { WorkspaceFormState } from "@/lib/workspace/form-state";
import { isTaskStatus, isWorkspaceId } from "@/lib/workspace/status";
import { parseMilestoneForm, parseNewTaskForm, parseTaskForm } from "@/lib/workspace/validation";

/** SQLSTATE for a foreign key violation: the project or milestone is gone. */
const FOREIGN_KEY_VIOLATION = "23503";

const FIELDS = ["title", "dueOn", "milestoneId", "status"] as const;

function submittedValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    FIELDS.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value.slice(0, 500) : ""];
    }),
  );
}

function projectPage(projectId: string): string {
  return `/admin/projects/${projectId}`;
}

/** A form's `projectId` and optional row id, or null when either is malformed. */
function ids(formData: FormData, rowField?: "milestoneId" | "taskId"): { projectId: string; rowId: string } | null {
  const projectId = formData.get("projectId");
  const rowId = rowField ? formData.get(rowField) : "";
  if (!isProjectId(projectId)) return null;
  if (rowField && !isWorkspaceId(rowId)) return null;
  return { projectId, rowId: typeof rowId === "string" ? rowId : "" };
}

/**
 * A failed save. A FK violation means the project (or, for tasks, the chosen
 * milestone) was deleted meanwhile, which is the admin's to fix, not a crash.
 */
function failed(label: string, error: unknown, values: Record<string, string>): WorkspaceFormState {
  if (describeErrorForLog(error).code === FOREIGN_KEY_VIOLATION) {
    return label.startsWith("task")
      ? { status: "invalid", errors: { milestoneId: "That milestone no longer exists." }, values }
      : { status: "error", message: "This project no longer exists.", values };
  }
  console.error(`[admin] ${label} failed`, { event: "error", ...describeErrorForLog(error) });
  return { status: "error", message: "That couldn't be saved. Try again.", values };
}

// --- Inline add forms on the project page -----------------------------------

export async function addMilestone(_previous: WorkspaceFormState, formData: FormData): Promise<WorkspaceFormState> {
  await requireUser();
  if (!(formData instanceof FormData)) return { status: "error", message: "Try again.", values: {} };
  const target = ids(formData);
  if (!target) redirect("/admin/projects");

  const values = submittedValues(formData);
  const parsed = parseMilestoneForm(formData);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors, values };

  try {
    await createMilestone(target.projectId, parsed.value);
  } catch (error) {
    return failed("milestone add", error, values);
  }
  refresh();
  return { status: "saved" };
}

export async function addTask(_previous: WorkspaceFormState, formData: FormData): Promise<WorkspaceFormState> {
  await requireUser();
  if (!(formData instanceof FormData)) return { status: "error", message: "Try again.", values: {} };
  const target = ids(formData);
  if (!target) redirect("/admin/projects");

  const values = submittedValues(formData);
  const parsed = parseNewTaskForm(formData);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors, values };

  try {
    await createTask(target.projectId, parsed.value);
  } catch (error) {
    return failed("task add", error, values);
  }
  refresh();
  return { status: "saved" };
}

// --- One-click row buttons -----------------------------------------------------

/** Move a task to the status in the form (Start / Done / Reopen). */
export async function changeTaskStatus(formData: FormData): Promise<void> {
  await requireUser();
  if (!(formData instanceof FormData)) return;
  const target = ids(formData, "taskId");
  const status = formData.get("status");
  if (!target || !isTaskStatus(status)) return;

  try {
    await setTaskStatus(target.projectId, target.rowId, status);
  } catch (error) {
    console.error("[admin] task status failed", { event: "error", ...describeErrorForLog(error) });
    throw new Error("The task couldn't be updated. Try again.");
  }
  refresh();
}

export async function changeMilestoneCompleted(formData: FormData): Promise<void> {
  await requireUser();
  if (!(formData instanceof FormData)) return;
  const target = ids(formData, "milestoneId");
  const completed = formData.get("completed");
  if (!target || (completed !== "true" && completed !== "false")) return;

  try {
    await setMilestoneCompleted(target.projectId, target.rowId, completed === "true");
  } catch (error) {
    console.error("[admin] milestone completion failed", { event: "error", ...describeErrorForLog(error) });
    throw new Error("The milestone couldn't be updated. Try again.");
  }
  refresh();
}

// --- Edit pages -----------------------------------------------------------------

export async function saveMilestone(_previous: WorkspaceFormState, formData: FormData): Promise<WorkspaceFormState> {
  await requireUser();
  if (!(formData instanceof FormData)) return { status: "error", message: "Try again.", values: {} };
  const target = ids(formData, "milestoneId");
  if (!target) redirect("/admin/projects");

  const values = submittedValues(formData);
  const parsed = parseMilestoneForm(formData);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors, values };

  try {
    await updateMilestone(target.projectId, target.rowId, parsed.value);
  } catch (error) {
    return failed("milestone save", error, values);
  }
  redirect(projectPage(target.projectId));
}

export async function saveTask(_previous: WorkspaceFormState, formData: FormData): Promise<WorkspaceFormState> {
  await requireUser();
  if (!(formData instanceof FormData)) return { status: "error", message: "Try again.", values: {} };
  const target = ids(formData, "taskId");
  if (!target) redirect("/admin/projects");

  const values = submittedValues(formData);
  const parsed = parseTaskForm(formData);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors, values };

  try {
    await updateTask(target.projectId, target.rowId, parsed.value);
  } catch (error) {
    return failed("task save", error, values);
  }
  redirect(projectPage(target.projectId));
}

export async function removeMilestone(formData: FormData): Promise<void> {
  await requireUser();
  if (!(formData instanceof FormData)) return;
  const target = ids(formData, "milestoneId");
  if (!target) return;
  try {
    await deleteMilestone(target.projectId, target.rowId);
  } catch (error) {
    console.error("[admin] milestone delete failed", { event: "error", ...describeErrorForLog(error) });
    throw new Error("The milestone couldn't be deleted. Try again.");
  }
  redirect(projectPage(target.projectId));
}

export async function removeTask(formData: FormData): Promise<void> {
  await requireUser();
  if (!(formData instanceof FormData)) return;
  const target = ids(formData, "taskId");
  if (!target) return;
  try {
    await deleteTask(target.projectId, target.rowId);
  } catch (error) {
    console.error("[admin] task delete failed", { event: "error", ...describeErrorForLog(error) });
    throw new Error("The task couldn't be deleted. Try again.");
  }
  redirect(projectPage(target.projectId));
}
