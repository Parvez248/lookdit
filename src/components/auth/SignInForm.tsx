"use client";

import { useActionState } from "react";

import { initialSignInState, type SignInState } from "@/lib/auth/sign-in-state";

import styles from "./SignInForm.module.css";

type SignInFormProps = {
  /** The sign-in Server Action: staff (`signIn`) or client portal (`portalSignIn`). */
  action: (previous: SignInState, formData: FormData) => Promise<SignInState>;
};

/**
 * Shared by the admin and the client portal sign-in pages. Client only for the
 * pending state and the inline error. Without JavaScript the form still posts to
 * the same Server Action and the page re-renders the result.
 */
export function SignInForm({ action }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(action, initialSignInState);
  const error = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          spellCheck={false}
          required
          maxLength={254}
          // React resets the form after each submit; the reset restores this value.
          defaultValue={state.status === "error" ? state.email : undefined}
          aria-invalid={error ? true : undefined}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          aria-invalid={error ? true : undefined}
          className={styles.input}
        />
      </div>

      {/* Always rendered, so screen readers announce the message when it appears. */}
      <div id="sign-in-error" role="alert" className={styles.alertRegion}>
        {error ? (
          <p className={styles.alert}>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.alertIcon}>
              <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 4.5v4.25M8 10.75v.75" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>{error}</span>
          </p>
        ) : null}
      </div>

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
