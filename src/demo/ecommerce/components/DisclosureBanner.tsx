import { demoDisclosure } from "../brand";
import styles from "./DisclosureBanner.module.css";

/** The locked concept disclosure, on every demo page. Plain text: not an alert, not dismissible. */
export function DisclosureBanner() {
  return (
    <aside className={styles.banner} aria-label="About this demo">
      <p className={`container ${styles.text}`}>{demoDisclosure}</p>
    </aside>
  );
}
