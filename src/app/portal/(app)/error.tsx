"use client";

import styles from "./not-found.module.css";

/**
 * Portal error boundary: a calm message and a retry, never error details (they
 * stay in the server log). Must be a Client Component.
 */
export default function PortalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className={`container ${styles.page}`} role="alert">
      <p className={styles.code}>Error</p>
      <h1 className={styles.title}>Something went wrong.</h1>
      <p className={styles.body}>Try again in a moment. If it keeps happening, let your LOOKDIT contact know.</p>
      <button type="button" onClick={() => retry()} className={styles.link}>
        Try again
      </button>
    </div>
  );
}
