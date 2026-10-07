"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { saveClient } from "@/app/actions/admin-clients";
import { initialClientFormState } from "@/lib/clients/form-state";
import { CLIENT_STATUS_LABELS, CLIENT_STATUSES, type ClientStatus } from "@/lib/clients/status";
import { CLIENT_LIMITS, type ClientField } from "@/lib/clients/validation";

import styles from "./AdminForm.module.css";

export type ClientFormValues = {
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  status: ClientStatus;
};

type ClientFormProps = {
  /** Present when editing; absent when adding. */
  id?: string;
  initial: ClientFormValues;
  cancelHref: string;
};

const textFields: { name: Exclude<ClientField, "notes" | "status">; label: string; type: string; autoComplete: string; hint?: string }[] = [
  { name: "name", label: "Name", type: "text", autoComplete: "off" },
  { name: "company", label: "Company", type: "text", autoComplete: "off" },
  { name: "email", label: "Email", type: "email", autoComplete: "off" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "off" },
  { name: "website", label: "Website", type: "text", autoComplete: "off", hint: "For example, example.com" },
];

/**
 * Client only for the pending state and inline errors. Without JavaScript the
 * form still posts to the same Server Action.
 */
export function ClientForm({ id, initial, cancelHref }: ClientFormProps) {
  const [state, formAction, pending] = useActionState(saveClient, initialClientFormState);
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
        {textFields.map((field) => {
          const error = errors[field.name];
          const describedBy = [field.hint ? `${field.name}-hint` : null, error ? `${field.name}-error` : null]
            .filter(Boolean)
            .join(" ");
          return (
            <div key={field.name} className={`${styles.field} ${field.name === "name" ? styles.wide : ""}`}>
              <label htmlFor={field.name} className={styles.label}>
                {field.label}
                {field.name === "name" ? null : <span className={styles.optional}>Optional</span>}
              </label>
              {field.hint ? (
                <p id={`${field.name}-hint`} className={styles.hint}>
                  {field.hint}
                </p>
              ) : null}
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                spellCheck={field.name === "email" || field.name === "website" ? false : undefined}
                required={field.name === "name"}
                maxLength={CLIENT_LIMITS[field.name]}
                defaultValue={values[field.name] ?? ""}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy || undefined}
                className={styles.input}
              />
              {error ? (
                <p id={`${field.name}-error`} className={styles.error}>
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}

        <fieldset className={`${styles.field} ${styles.wide} ${styles.fieldset}`} aria-describedby={errors.status ? "status-error" : undefined}>
          <legend className={styles.label}>Status</legend>
          <div className={styles.segmented}>
            {CLIENT_STATUSES.map((status) => (
              <label key={status} className={styles.segment}>
                <input
                  type="radio"
                  name="status"
                  value={status}
                  defaultChecked={(values.status ?? initial.status) === status}
                  className={styles.radio}
                />
                <span>{CLIENT_STATUS_LABELS[status]}</span>
              </label>
            ))}
          </div>
          {errors.status ? (
            <p id="status-error" className={styles.error}>
              {errors.status}
            </p>
          ) : null}
        </fieldset>

        <div className={`${styles.field} ${styles.wide}`}>
          <label htmlFor="notes" className={styles.label}>
            Notes<span className={styles.optional}>Optional</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={6}
            maxLength={CLIENT_LIMITS.notes}
            defaultValue={values.notes ?? ""}
            aria-invalid={errors.notes ? true : undefined}
            aria-describedby={errors.notes ? "notes-error" : undefined}
            className={`${styles.input} ${styles.textarea}`}
          />
          {errors.notes ? (
            <p id="notes-error" className={styles.error}>
              {errors.notes}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? "Saving…" : id ? "Save changes" : "Add client"}
        </button>
        <Link href={cancelHref} className={styles.cancel}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
