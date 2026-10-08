"use client";

import { startTransition, useActionState, useId } from "react";

import { type MediaFormState, saveMediaDetails } from "@/app/actions/admin-media";
import { MEDIA_LIMITS, MEDIA_ROLE_LABELS, MEDIA_ROLES } from "@/lib/projects/media";

import form from "../AdminForm.module.css";
import styles from "./Media.module.css";

const initialState: MediaFormState = { status: "idle" };

type MediaDetailsFormProps = {
  projectId: string;
  mediaId: string;
  alt: string;
  role: string;
  displayOrder: number;
};

/**
 * Alt text, role and order for one image. Client only for the pending and saved
 * states. Submits through onSubmit so React doesn't reset the fields: a rejected
 * save keeps what was typed.
 */
export function MediaDetailsForm({ projectId, mediaId, alt, role, displayOrder }: MediaDetailsFormProps) {
  const [state, formAction, pending] = useActionState(saveMediaDetails, initialState);
  const id = useId();

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      className={styles.details}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="mediaId" value={mediaId} />

      <div className={`${form.field} ${styles.altField}`}>
        <label htmlFor={`${id}-alt`} className={form.label}>
          Alt text
        </label>
        <input
          id={`${id}-alt`}
          name="alt"
          type="text"
          required
          maxLength={MEDIA_LIMITS.alt}
          defaultValue={alt}
          autoComplete="off"
          className={form.input}
        />
      </div>
      <div className={form.field}>
        <label htmlFor={`${id}-role`} className={form.label}>
          Use as
        </label>
        <select id={`${id}-role`} name="role" defaultValue={role} className={`${form.input} ${form.select}`}>
          {MEDIA_ROLES.map((value) => (
            <option key={value} value={value}>
              {MEDIA_ROLE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div className={form.field}>
        <label htmlFor={`${id}-order`} className={form.label}>
          Order
        </label>
        <input
          id={`${id}-order`}
          name="displayOrder"
          type="text"
          inputMode="numeric"
          pattern="\d{1,4}"
          required
          defaultValue={String(displayOrder)}
          className={`${form.input} ${styles.order}`}
        />
      </div>
      <div className={styles.detailsActions}>
        <button type="submit" className={styles.save} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <p role="status" className={styles.message}>
          {state.status === "error" ? (
            <span className={form.error}>{state.message}</span>
          ) : state.status === "saved" && !pending ? (
            "Saved."
          ) : null}
        </p>
      </div>
    </form>
  );
}
