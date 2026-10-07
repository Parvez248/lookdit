import Link from "next/link";

import styles from "./Breadcrumbs.module.css";

export type Crumb = { label: string; href: string };

/** Ancestors as links, then the current page as plain text with aria-current. */
export function Breadcrumbs({ trail, current }: { trail: readonly Crumb[]; current: string }) {
  return (
    <nav aria-label="Breadcrumb" className={styles.nav}>
      <ol className={styles.list}>
        {trail.map((crumb) => (
          <li key={crumb.href} className={styles.item}>
            <Link href={crumb.href} className={styles.link}>
              {crumb.label}
            </Link>
          </li>
        ))}
        <li className={styles.item}>
          <span aria-current="page" className={styles.current}>
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}
