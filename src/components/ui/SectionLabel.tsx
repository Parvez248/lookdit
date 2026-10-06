import type { ReactNode } from "react";

import styles from "./SectionLabel.module.css";

type SectionLabelProps = {
  children: ReactNode;
  /**
   * `p` when the section has its own h2; `h2` when the label is the section's
   * only heading, so the outline stays complete without inventing a title.
   */
  as?: "p" | "h2";
  id?: string;
  className?: string;
};

/** The mono kicker that opens a home page section, with a small brand marker. */
export function SectionLabel({ children, as: Tag = "p", id, className }: SectionLabelProps) {
  return (
    <Tag id={id} className={className ? `${styles.label} ${className}` : styles.label}>
      {children}
    </Tag>
  );
}
