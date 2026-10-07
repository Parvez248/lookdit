"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { saveMilestone, saveTask } from "@/app/actions/admin-workspace";
import { initialWorkspaceFormState } from "@/lib/workspace/form-state";
import { TASK_STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/lib/workspace/status";
import { WORKSPACE_LIMITS, type FieldErrors } from "@/lib/workspace/validation";

import styles from "../AdminForm.module.css";

type Props = {
  projectId: string;
  cancelHref: string;
} & (
  | { kind: "milestone"; milestoneId: string; initial: { title: string; dueOn: string } }
  | {
      kind: "task";
      taskId: string;
      initial: { title: string; dueOn: string; milestoneId: string; status: TaskStatus };
      milestones: { id: string; title: string }[];
    }
);

/** Edit a milestone or a task. Same field styles and error handling as the other admin forms. */
export function WorkspaceEditForm(props: Props) {
  const [state, formAction, pending] = useActionState(
    props.kind === "task" ? saveTask : saveMilestone,
    initialWorkspaceFormState,
  );
  const errors: FieldErrors = state.status === "invalid" ? state.errors : {};
  const values: Record<string, string> =
    state.status === "invalid" || state.status === "error" ? state.values : props.initial;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "invalid") return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  function wire(field: keyof FieldErrors) {
    return {
      id: field,
      name: field,
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? `${field}-error` : undefined,
    };
  }

  function errorFor(field: keyof FieldErrors) {
    return errors[field] ? (
      <p id={`${field}-error`} className={styles.error}>
        {errors[field]}
      </p>
    ) : null;
  }

  return (
    <form ref={formRef} action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="projectId" value={props.projectId} />
      {props.kind === "task" ? (
        <input type="hidden" name="taskId" value={props.taskId} />
      ) : (
        <input type="hidden" name="milestoneId" value={props.milestoneId} />
      )}

      <div role="alert" className={styles.summaryRegion}>
        {state.status === "error" ? <p className={styles.summary}>{state.message}</p> : null}
      </div>

      <div className={styles.grid}>
        <div className={`${styles.field} ${styles.wide}`}>
          <label htmlFor="title" className={styles.label}>
            Title
          </label>
          <input
            {...wire("title")}
            type="text"
            autoComplete="off"
            required
            maxLength={props.kind === "task" ? WORKSPACE_LIMITS.taskTitle : WORKSPACE_LIMITS.milestoneTitle}
            defaultValue={values.title ?? ""}
            className={styles.input}
          />
          {errorFor("title")}
        </div>

        {props.kind === "task" ? (
          <>
            <div className={styles.field}>
              <label htmlFor="status" className={styles.label}>
                Status
              </label>
              <select
                key={values.status}
                {...wire("status")}
                defaultValue={values.status ?? "todo"}
                className={`${styles.input} ${styles.select}`}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              {errorFor("status")}
            </div>
            <div className={styles.field}>
              <label htmlFor="milestoneId" className={styles.label}>
                Milestone<span className={styles.optional}>Optional</span>
              </label>
              <select
                key={values.milestoneId}
                {...wire("milestoneId")}
                defaultValue={values.milestoneId ?? ""}
                className={`${styles.input} ${styles.select}`}
              >
                <option value="">No milestone</option>
                {props.milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.title}
                  </option>
                ))}
              </select>
              {errorFor("milestoneId")}
            </div>
          </>
        ) : null}

        <div className={styles.field}>
          <label htmlFor="dueOn" className={styles.label}>
            Due date<span className={styles.optional}>Optional</span>
          </label>
          <input {...wire("dueOn")} type="date" defaultValue={values.dueOn ?? ""} className={`${styles.input} ${styles.short} ${styles.date}`} />
          {errorFor("dueOn")}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link href={props.cancelHref} className={styles.cancel}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
