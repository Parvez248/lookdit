import styles from "./ProgressBar.module.css";

type ProgressBarProps = {
  percent: number;
  size?: "small" | "large";
  /** Finished work: a quieter fill. */
  muted?: boolean;
};

/**
 * The share of tasks done, as a thin rule. Decorative: the percentage and the
 * "n of m tasks done" text beside it carry the meaning.
 */
export function ProgressBar({ percent, size = "small", muted = false }: ProgressBarProps) {
  return (
    <div className={styles.bar} data-size={size} data-muted={muted || undefined} aria-hidden="true">
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
}
