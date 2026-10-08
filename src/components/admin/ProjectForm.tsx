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
  client: string;
  liveUrl: string;
  /** "on" when featured, "" when not: the value a checkbox posts. */
  featured: "on" | "";
  metrics: string;
  seoTitle: string;
  seoDescription: string;
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

      <fieldset className={`${styles.fieldset} ${styles.group}`}>
        <legend className={styles.groupTitle}>Public case study</legend>
        <p className={styles.groupHint}>Shown on the site&rsquo;s Work page only while the project is published.</p>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="client" className={styles.label}>
              Client name<span className={styles.optional}>Optional</span>
            </label>
            <p id="client-hint" className={styles.hint}>
              As it should appear publicly. Leave blank to keep the client private.
            </p>
            <input
              {...describe("client", true)}
              type="text"
              autoComplete="off"
              maxLength={PROJECT_LIMITS.client}
              defaultValue={values.client ?? ""}
              className={styles.input}
            />
            {errorFor("client")}
          </div>

          <div className={styles.field}>
            <label htmlFor="liveUrl" className={styles.label}>
              Live site<span className={styles.optional}>Optional</span>
            </label>
            <p id="liveUrl-hint" className={styles.hint}>
              The full address, starting with https://
            </p>
            <input
              {...describe("liveUrl", true)}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              maxLength={PROJECT_LIMITS.liveUrl}
              defaultValue={values.liveUrl ?? ""}
              className={styles.input}
            />
            {errorFor("liveUrl")}
          </div>

          <div className={`${styles.field} ${styles.wide}`}>
            <label htmlFor="metrics" className={styles.label}>
              Results<span className={styles.optional}>Optional</span>
            </label>
            <p id="metrics-hint" className={styles.hint}>
              One per line as Value | Label, for example &ldquo;2× | Faster checkout&rdquo;. Real, measured
              results only. Up to {PROJECT_LIMITS.metrics}.
            </p>
            <textarea
              {...describe("metrics", true)}
              rows={4}
              spellCheck={false}
              defaultValue={values.metrics ?? ""}
              className={`${styles.input} ${styles.textarea} ${styles.textareaShort}`}
            />
            {errorFor("metrics")}
          </div>

          <div className={`${styles.field} ${styles.wide}`}>
            <label htmlFor="seoTitle" className={styles.label}>
              SEO title<span className={styles.optional}>Optional</span>
            </label>
            <p id="seoTitle-hint" className={styles.hint}>
              The browser and search title. Defaults to the project title.
            </p>
            <input
              {...describe("seoTitle", true)}
              type="text"
              autoComplete="off"
              maxLength={PROJECT_LIMITS.seoTitle}
              defaultValue={values.seoTitle ?? ""}
              className={styles.input}
            />
            {errorFor("seoTitle")}
          </div>

          <div className={`${styles.field} ${styles.wide}`}>
            <label htmlFor="seoDescription" className={styles.label}>
              SEO description<span className={styles.optional}>Optional</span>
            </label>
            <p id="seoDescription-hint" className={styles.hint}>
              The search snippet. Defaults to the summary. Up to {PROJECT_LIMITS.seoDescription} characters.
            </p>
            <textarea
              {...describe("seoDescription", true)}
              rows={2}
              maxLength={PROJECT_LIMITS.seoDescription}
              defaultValue={values.seoDescription ?? ""}
              className={`${styles.input} ${styles.textarea} ${styles.textareaShort}`}
            />
            {errorFor("seoDescription")}
          </div>

          <div className={`${styles.field} ${styles.wide}`}>
            <label className={styles.check}>
              <input
                // Keyed like the selects, so a rejected save keeps the admin's choice.
                key={values.featured}
                id="featured"
                name="featured"
                type="checkbox"
                defaultChecked={values.featured === "on"}
                aria-describedby="featured-hint"
                className={styles.checkbox}
              />
              <span>Feature this project</span>
            </label>
            <p id="featured-hint" className={styles.hint}>
              Featured projects are listed first on the Work page.
            </p>
          </div>
        </div>
      </fieldset>

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
