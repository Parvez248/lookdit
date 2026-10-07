import type { Metadata } from "next";
import Link from "next/link";

import { FilterTabs } from "@/components/admin/FilterTabs";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SectionLabel } from "@/components/ui/SectionLabel";
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

import list from "@/components/admin/AdminList.module.css";

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
    <div className={`container ${list.page}`}>
      <header className={list.intro}>
        <div>
          <SectionLabel>{total === 1 ? "1 inquiry" : `${total} inquiries`}</SectionLabel>
          <h1 className={list.title}>Inquiries</h1>
          <p className={list.lede}>Requests from the contact form, newest first.</p>
        </div>
      </header>

      <FilterTabs
        label="Filter by status"
        tabs={filters.map((filter) => ({
          label: filter.label,
          href: inquiryListHref(filter.status),
          count: filter.count,
          current: filter.status === status,
        }))}
      />

      {items.length > 0 ? (
        <ol className={list.list}>
          {items.map((inquiry) => (
            <li key={inquiry.id} className={list.item}>
              <div className={list.who}>
                <h2 className={list.name}>
                  <Link href={`/admin/inquiries/${inquiry.id}`} className={list.link}>
                    {inquiry.name}
                  </Link>
                </h2>
                <p className={list.sub}>{inquiry.company ?? inquiry.email}</p>
              </div>
              <p className={styles.preview}>{inquiry.preview}</p>
              <div className={list.meta}>
                <StatusBadge status={inquiry.status} />
                <time dateTime={inquiry.createdAt.toISOString()} className={list.date}>
                  {formatDateUtc(inquiry.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className={list.empty}>
          <p className={list.emptyTitle}>
            {page > 1 ? "There's nothing on this page." : status ? `No ${INQUIRY_STATUS_LABELS[status].toLowerCase()} inquiries.` : "No inquiries yet."}
          </p>
          <p className={list.emptyBody}>
            {page > 1 ? (
              <Link href={inquiryListHref(status)} className={list.textLink}>
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

      <Pagination
        page={page}
        pageCount={pageCount}
        href={(target) => inquiryListHref(status, target)}
        previousLabel="Newer"
        nextLabel="Older"
      />
    </div>
  );
}
