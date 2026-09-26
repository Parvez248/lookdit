import styles from "./Wordmark.module.css";

/**
 * Temporary text wordmark. The approved Lookdit logo asset replaces this when
 * it is added to the repo.
 */
export function Wordmark() {
  return <span className={styles.wordmark}>lookdit</span>;
}
