"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";

import { type MediaFormState, uploadProjectImage } from "@/app/actions/admin-media";
import { MEDIA_LIMITS, MEDIA_UPLOAD_ACCEPT, MEDIA_UPLOAD_MAX_BYTES } from "@/lib/projects/media";

import form from "../AdminForm.module.css";
import styles from "./Media.module.css";

const initialState: MediaFormState = { status: "idle" };

type Size = { width: number; height: number } | null;

/** The image's pixel size, read in the browser so pages can reserve its space. Null if unreadable. */
async function measure(file: File): Promise<Size> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

/**
 * Upload one image with its alt text and role. Client only for measuring the
 * image, the early size check and the pending state; the Server Action checks
 * everything again (type by its bytes, size, alt) before anything is stored.
 */
export function MediaUploadForm({ projectId, hasHero }: { projectId: string; hasHero: boolean }) {
  const [state, formAction, pending] = useActionState(uploadProjectImage, initialState);
  const [size, setSize] = useState<Size>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();

  // Submitting through onSubmit (below) stops React's automatic form reset, so a
  // rejected upload keeps the chosen file and alt text; reset only on success.
  useEffect(() => {
    if (state.status === "saved") formRef.current?.reset();
  }, [state]);

  const error = clientError ?? (state.status === "error" ? state.message : null);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      className={styles.upload}
      onReset={() => {
        setSize(null);
        setClientError(null);
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="width" value={size?.width ?? ""} />
      <input type="hidden" name="height" value={size?.height ?? ""} />

      <div className={form.field}>
        <label htmlFor={`${id}-file`} className={form.label}>
          Image
        </label>
        <p id={`${id}-file-hint`} className={form.hint}>
          JPEG, PNG, WebP or AVIF, up to 4 MB. Around 2400 px wide is plenty.
        </p>
        <input
          id={`${id}-file`}
          name="file"
          type="file"
          accept={MEDIA_UPLOAD_ACCEPT}
          required
          aria-describedby={`${id}-file-hint`}
          className={styles.file}
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            setSize(null);
            setClientError(
              file && file.size > MEDIA_UPLOAD_MAX_BYTES ? "That image is over 4 MB. Export it smaller." : null,
            );
            if (file) setSize(await measure(file));
          }}
        />
      </div>

      <div className={form.field}>
        <label htmlFor={`${id}-alt`} className={form.label}>
          Alt text
        </label>
        <p id={`${id}-alt-hint`} className={form.hint}>
          What the image shows, for people who can&apos;t see it.
        </p>
        <input
          id={`${id}-alt`}
          name="alt"
          type="text"
          required
          maxLength={MEDIA_LIMITS.alt}
          autoComplete="off"
          aria-describedby={`${id}-alt-hint`}
          className={form.input}
        />
      </div>

      <fieldset className={form.fieldset}>
        <legend className={form.label}>Use as</legend>
        <div className={`${form.segmented} ${styles.roles}`}>
          <label className={form.segment}>
            <input type="radio" name="role" value="gallery" defaultChecked={hasHero} className={form.radio} />
            Gallery
          </label>
          <label className={form.segment}>
            <input type="radio" name="role" value="hero" defaultChecked={!hasHero} className={form.radio} />
            Hero
          </label>
        </div>
      </fieldset>

      <div className={styles.uploadActions}>
        <button type="submit" className={form.submit} disabled={pending || clientError !== null}>
          {pending ? "Uploading…" : "Upload image"}
        </button>
        <p role="status" className={styles.message}>
          {error ? <span className={form.error}>{error}</span> : state.status === "saved" ? "Image added." : null}
        </p>
      </div>
    </form>
  );
}
