import type { Metadata } from "next";
import Link from "next/link";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { countInquiriesByStatus, listInquiries } from "@/db/queries/inquiries";
import { requireUser } from "@/lib/auth/session";
import { formatDateUtc } from "@/lib/format-date";
import {
  INQUIRIES_PAGE_SIZE,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUSES,
  inquiryListHref,
  parseInquiryListParams,
} from "@/lib/inquiries/status";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Inquiries",
};

export default async function InquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  await requireUser();
  const { status, page } = parseInquiryListParams(await searchParams);
  const [counts, items] = await Promise.all([countInquiriesByStatus(), listInquiries(status, page)]);

  const total = INQUIRY_STATUSES.reduce((sum, s) => sum + counts[s], 0);
  const filteredTotal = status ? counts[status] : total;
  const pageCount = Math.max(1, Math.ceil(filteredTotal / INQUIRIES_PAGE_SIZE));
  const filters = [
    { status: null, label: "All", count: total },
    ...INQUIRY_STATUSES.map((s) => ({ status: s, label: INQUIRY_STATUS_LABELS[s], count: counts[s] })),
  ];

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.intro}>
        <h1 className={styles.title}>Inquiries</h1>
        <p className={styles.lede}>Requests from the contact form, newest first.</p>
      </header>

      <nav aria-label="Filter by status" className={styles.filters}>
        <ul className={styles.filterList}>
          {filters.map((filter) => (
            <li key={filter.label}>
              <Link
                href={inquiryListHref(filter.status)}
                className={styles.filter}
                aria-current={filter.status === status ? "page" : undefined}
              >
                {filter.label}
                <span className={styles.filterCount}>{filter.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {items.length > 0 ? (
        <ol className={styles.list}>
          {items.map((inquiry) => (
            <li key={inquiry.id} className={styles.item}>
              <div className={styles.who}>
                <h2 className={styles.name}>
                  <Link href={`/admin/inquiries/${inquiry.id}`} className={styles.link}>
                    {inquiry.name}
                  </Link>
                </h2>
                <p className={styles.org}>{inquiry.company ?? inquiry.email}</p>
              </div>
              <p className={styles.preview}>{inquiry.preview}</p>
              <div className={styles.meta}>
                <StatusBadge status={inquiry.status} />
                <time dateTime={inquiry.createdAt.toISOString()} className={styles.date}>
                  {formatDateUtc(inquiry.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {page > 1 ? "There's nothing on this page." : status ? `No ${INQUIRY_STATUS_LABELS[status].toLowerCase()} inquiries.` : "No inquiries yet."}
          </p>
          <p className={styles.emptyBody}>
            {page > 1 ? (
              <Link href={inquiryListHref(status)} className={styles.textLink}>
                Go to the first page
              </Link>
            ) : status ? (
              `Inquiries marked ${INQUIRY_STATUS_LABELS[status].toLowerCase()} appear here.`
            ) : (
              "New requests from the contact form appear here."
            )}
          </p>
        </div>
      )}

      {pageCount > 1 && page <= pageCount ? (
        <nav aria-label="Pagination" className={styles.pagination}>
          {page > 1 ? (
            <Link href={inquiryListHref(status, page - 1)} className={styles.pageLink} rel="prev">
              Newer
            </Link>
          ) : (
            <span />
          )}
          <p className={styles.pageStatus}>
            Page {page} of {pageCount}
          </p>
          {page < pageCount ? (
            <Link href={inquiryListHref(status, page + 1)} className={styles.pageLink} rel="next">
              Older
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
