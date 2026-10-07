"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { saveProject } from "@/app/actions/admin-projects";
import type { ClientOption } from "@/db/queries/admin-projects";
import { initialProjectFormState } from "@/lib/projects/form-state";
import {
  PROJECT_CATEGORIES,
  PROJECT_CATEGORY_LABELS,
  WORK_STATUS_LABELS,
  WORK_STATUSES,
  type ProjectCategory,
  type WorkStatus,
} from "@/lib/projects/status";
import { PROJECT_LIMITS, type ProjectField } from "@/lib/projects/validation";

import styles from "./AdminForm.module.css";

export type ProjectFormValues = {
  title: string;
  clientId: string;
  workStatus: WorkStatus;
  category: ProjectCategory;
  year: string;
  summary: string;
};

type ProjectFormProps = {
  /** Present when editing; absent when adding. */
  id?: string;
  initial: ProjectFormValues;
  clients: ClientOption[];
  cancelHref: string;
};

/**
 * Client only for the pending state, inline errors and focus on the first
 * error. Without JavaScript the form still posts to the same Server Action.
 */
export function ProjectForm({ id, initial, clients, cancelHref }: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(saveProject, initialProjectFormState);
  const errors = state.status === "invalid" ? state.errors : {};
  // After a failed save, show what was typed; otherwise the stored values.
  const values: Record<string, string> = state.status === "idle" ? initial : state.values;
  const errorCount = Object.keys(errors).length;
  const formRef = useRef<HTMLFormElement>(null);

  // After each rejected save, move keyboard focus to the first field to fix.
  useEffect(() => {
    if (state.status !== "invalid") return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  // React applies a <select>'s defaultValue only when it mounts, and resets the
  // form after each submit. Keying each select on its value remounts it with
  // what was submitted, so a rejected save keeps the admin's choices.

  /** Props that wire a control to its hint and error message. */
  function describe(field: ProjectField, hint?: boolean) {
    const error = errors[field];
    const describedBy = [hint ? `${field}-hint` : null, error ? `${field}-error` : null].filter(Boolean).join(" ");
    return {
      id: field,
      name: field,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": describedBy || undefined,
    };
  }

  function errorFor(field: ProjectField) {
    return errors[field] ? (
      <p id={`${field}-error`} className={styles.error}>
        {errors[field]}
      </p>
    ) : null;
  }

  return (
    <form ref={formRef} action={formAction} className={styles.form} noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}

      <div role="alert" className={styles.summaryRegion}>
        {errorCount > 0 ? (
          <p className={styles.summary}>
            {errorCount === 1 ? "One field needs attention." : `${errorCount} fields need attention.`}
          </p>
        ) : state.status === "error" ? (
          <p className={styles.summary}>{state.message}</p>
        ) : null}
      </div>

      <div className={styles.grid}>
        <div className={`${styles.field} ${styles.wide}`}>
          <label htmlFor="title" className={styles.label}>
            Title
          </label>
          <input
            {...describe("title")}
            type="text"
            autoComplete="off"
            required
            maxLength={PROJECT_LIMITS.title}
            defaultValue={values.title ?? ""}
            className={styles.input}
          />
          {errorFor("title")}
        </div>

        <div className={styles.field}>
          <label htmlFor="clientId" className={styles.label}>
            Client<span className={styles.optional}>Optional</span>
          </label>
          <select key={values.clientId} {...describe("clientId")} defaultValue={values.clientId ?? ""} className={`${styles.input} ${styles.select}`}>
            <option value="">No client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company && client.company !== client.name ? `${client.name} (${client.company})` : client.name}
              </option>
            ))}
          </select>
          {errorFor("clientId")}
        </div>

        <div className={styles.field}>
          <label htmlFor="workStatus" className={styles.label}>
            Status
          </label>
          <select key={values.workStatus} {...describe("workStatus")} defaultValue={values.workStatus ?? "planned"} className={`${styles.input} ${styles.select}`}>
            {WORK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {WORK_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {errorFor("workStatus")}
        </div>

        <div className={styles.field}>
          <label htmlFor="category" className={styles.label}>
            Category
          </label>
          <select key={values.category} {...describe("category")} defaultValue={values.category ?? "website"} className={`${styles.input} ${styles.select}`}>
            {PROJECT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {PROJECT_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          {errorFor("category")}
        </div>

        <div className={styles.field}>
          <label htmlFor="year" className={styles.label}>
            Year
          </label>
          <input
            {...describe("year")}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required
            maxLength={4}
            defaultValue={values.year ?? ""}
            className={`${styles.input} ${styles.short}`}
          />
          {errorFor("year")}
        </div>

        <div className={`${styles.field} ${styles.wide}`}>
          <label htmlFor="summary" className={styles.label}>
            Summary
          </label>
          <p id="summary-hint" className={styles.hint}>
            One or two sentences on what the work is. Up to {PROJECT_LIMITS.summary} characters.
          </p>
          <textarea
            {...describe("summary", true)}
            rows={3}
            required
            maxLength={PROJECT_LIMITS.summary}
            defaultValue={values.summary ?? ""}
            className={`${styles.input} ${styles.textarea} ${styles.textareaShort}`}
          />
          {errorFor("summary")}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? "Saving…" : id ? "Save changes" : "Add project"}
        </button>
        <Link href={cancelHref} className={styles.cancel}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
