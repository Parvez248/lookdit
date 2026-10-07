"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import { addMilestone, addTask } from "@/app/actions/admin-workspace";
import { initialWorkspaceFormState } from "@/lib/workspace/form-state";
import { WORKSPACE_LIMITS } from "@/lib/workspace/validation";

import styles from "./Workspace.module.css";

type InlineAddProps = {
  kind: "task" | "milestone";
  projectId: string;
  /** Tasks only: the milestone the new task goes into. */
  milestoneId?: string | null;
  /** Visible label, e.g. "Add task to Design". */
  label: string;
};

/**
 * One-line add form: title, optional due date, Add. Client only for the pending
 * state, the inline error and keeping focus in the title for quick entry;
 * without JavaScript it still posts to the same Server Action.
 */
export function InlineAdd({ kind, projectId, milestoneId = null, label }: InlineAddProps) {
  const [state, formAction, pending] = useActionState(
    kind === "task" ? addTask : addMilestone,
    initialWorkspaceFormState,
  );
  const id = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const error =
    state.status === "invalid"
      ? (state.errors.title ?? state.errors.dueOn ?? state.errors.milestoneId)
      : state.status === "error"
        ? state.message
        : undefined;
  const values = state.status === "invalid" || state.status === "error" ? state.values : null;

  // After an add (or a rejected one), stay in the title for the next entry.
  useEffect(() => {
    if (state.status !== "idle") titleRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className={styles.add} data-kind={kind} noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      {kind === "task" ? <input type="hidden" name="milestoneId" value={milestoneId ?? ""} /> : null}
      <label htmlFor={`${id}-title`} className="visually-hidden">
        {label}
      </label>
      <input
        ref={titleRef}
        id={`${id}-title`}
        name="title"
        type="text"
        autoComplete="off"
        placeholder={kind === "task" ? "Add a task" : "Add a milestone"}
        maxLength={kind === "task" ? WORKSPACE_LIMITS.taskTitle : WORKSPACE_LIMITS.milestoneTitle}
        defaultValue={values?.title ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={styles.addTitle}
      />
      <label htmlFor={`${id}-due`} className="visually-hidden">
        Due date (optional)
      </label>
      <input
        id={`${id}-due`}
        name="dueOn"
        type="date"
        defaultValue={values?.dueOn ?? ""}
        className={styles.addDate}
      />
      <button type="submit" className={styles.addButton} disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </button>
      <p id={`${id}-error`} role="alert" className={styles.addError}>
        {error}
      </p>
    </form>
  );
}
