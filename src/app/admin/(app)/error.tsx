"use client";

import styles from "./not-found.module.css";

/**
 * Admin error boundary: a calm message and a retry, never error details (they
 * stay in the server log). Must be a Client Component.
 */
export default function AdminError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className={`container ${styles.page}`} role="alert">
      <p className={styles.code}>Error</p>
      <h1 className={styles.title}>Something went wrong.</h1>
      <p className={styles.body}>Nothing was lost. Try again, and if it keeps happening, check the server log.</p>
      <button type="button" onClick={() => retry()} className={styles.link}>
        Try again
      </button>
    </div>
  );
}
