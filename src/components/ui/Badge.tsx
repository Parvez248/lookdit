import styles from "./Badge.module.css";

/** `action` (blue) marks what needs attention; the others only tell statuses apart. */
export type BadgeTone = "action" | "signal" | "strong" | "neutral" | "outline";

/** A status as a small mono label with a marker. The text carries the meaning. */
export function Badge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {label}
    </span>
  );
}
