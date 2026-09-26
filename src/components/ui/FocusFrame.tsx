import type { ReactNode } from "react";

import styles from "./FocusFrame.module.css";

type FocusFrameProps = {
  children: ReactNode;
  /** Play the CSS load intro (corners settle in). Skipped under reduced motion. */
  intro?: boolean;
  className?: string;
};

/**
 * The Lookdit signature: four viewfinder corners around what is in focus.
 * Purely decorative, so the corners are hidden from assistive technology and
 * the framed content reads as normal inline text.
 */
export function FocusFrame({ children, intro = false, className }: FocusFrameProps) {
  const classes = [styles.frame, intro && styles.intro, className].filter(Boolean).join(" ");

  return (
    <span className={classes}>
      {children}
      <span className={styles.corners} aria-hidden="true">
        <span className={styles.tl} />
        <span className={styles.tr} />
        <span className={styles.bl} />
        <span className={styles.br} />
      </span>
    </span>
  );
}
