"use client";

import { useActionState } from "react";

import { signIn } from "@/app/actions/auth";
import { initialSignInState } from "@/lib/auth/sign-in-state";

import styles from "./SignInForm.module.css";

/**
 * Client only for the pending state and the inline error. Without JavaScript the
 * form still posts to the same Server Action and the page re-renders the result.
 */
export function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, initialSignInState);
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
