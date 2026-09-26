import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./ButtonLink.module.css";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  /** `primary`: solid blue action. `quiet`: text link with an arrow. */
  variant?: "primary" | "quiet";
  size?: "md" | "sm";
  className?: string;
  onClick?: () => void;
};

/** A navigation link styled as an action. Every CTA in the site is a link. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
}: ButtonLinkProps) {
  const classes = [styles.root, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Link href={href} className={classes} onClick={onClick}>
      <span>{children}</span>
      <svg className={styles.arrow} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </Link>
  );
}
