import Link from "next/link";

import styles from "./Pagination.module.css";

type PaginationProps = {
  page: number;
  pageCount: number;
  href: (page: number) => string;
  /** Labels for the earlier and later pages, e.g. "Newer" / "Older". */
  previousLabel: string;
  nextLabel: string;
};

/** Previous / next links with "Page x of y". Renders nothing for a single page. */
export function Pagination({ page, pageCount, href, previousLabel, nextLabel }: PaginationProps) {
  if (pageCount <= 1 || page > pageCount) return null;
  return (
    <nav aria-label="Pagination" className={styles.pagination}>
      {page > 1 ? (
        <Link href={href(page - 1)} className={styles.link} rel="prev">
          {previousLabel}
        </Link>
      ) : (
        <span />
      )}
      <p className={styles.status}>
        Page {page} of {pageCount}
      </p>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={`${styles.link} ${styles.next}`} rel="next">
          {nextLabel}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
