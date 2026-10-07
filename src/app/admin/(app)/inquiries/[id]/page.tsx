import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { makeClientFromInquiry } from "@/app/actions/admin-clients";
import { setInquiryStatus } from "@/app/actions/admin-inquiries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getClientName } from "@/db/queries/clients";
import { getInquiry } from "@/db/queries/inquiries";
import { requireUser } from "@/lib/auth/session";
import { formatDateTimeUtc } from "@/lib/format-date";
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUSES, inquiryListHref, isInquiryId } from "@/lib/inquiries/status";

import styles from "@/components/admin/AdminDetail.module.css";

// The title is generic on purpose: an inquirer's name shouldn't land in tab
// titles, history or screenshots of the tab bar.
export const metadata: Metadata = {
  title: "Inquiry",
};

export default async function InquiryPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  await requireUser();
  const { id } = await params;
  if (!isInquiryId(id)) notFound();
  const inquiry = await getInquiry(id);
  if (inquiry === null) notFound();
  const clientName = inquiry.clientId ? await getClientName(inquiry.clientId) : null;

  const replySubject = encodeURIComponent("Re: your inquiry to LOOKDIT");

  return (
    <div className={`container ${styles.page}`}>
      <Link href={inquiryListHref(null)} className={styles.back}>
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.backIcon}>
          <path d="M13 8H3.5M7.5 4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        All inquiries
      </Link>

      <div className={styles.layout}>
        <article className={styles.main} aria-labelledby="inquiry-title">
          <header className={styles.header}>
            <StatusBadge status={inquiry.status} />
            <h1 id="inquiry-title" className={styles.title}>
              {inquiry.name}
            </h1>
            {inquiry.company ? <p className={styles.company}>{inquiry.company}</p> : null}
          </header>
          <div className={styles.message}>{inquiry.message}</div>
        </article>

        <aside className={styles.side} aria-label="Details and status">
          <dl className={styles.details}>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${inquiry.email}`} className={styles.email}>
                  {inquiry.email}
                </a>
              </dd>
            </div>
            <div>
              <dt>Received</dt>
              <dd>
                <time dateTime={inquiry.createdAt.toISOString()}>{formatDateTimeUtc(inquiry.createdAt)}</time>
              </dd>
            </div>
            {inquiry.updatedAt.getTime() !== inquiry.createdAt.getTime() ? (
              <div>
                <dt>Last updated</dt>
                <dd>
                  <time dateTime={inquiry.updatedAt.toISOString()}>{formatDateTimeUtc(inquiry.updatedAt)}</time>
                </dd>
              </div>
            ) : null}
          </dl>

          <a href={`mailto:${inquiry.email}?subject=${replySubject}`} className={styles.reply}>
            Reply by email
          </a>

          <div className={styles.clientRow}>
            <p className={styles.clientLabel}>Client</p>
            {inquiry.clientId && clientName ? (
              <Link href={`/admin/clients/${inquiry.clientId}`} className={styles.email}>
                {clientName}
              </Link>
            ) : (
              <form action={makeClientFromInquiry}>
                <input type="hidden" name="inquiryId" value={inquiry.id} />
                <button type="submit" className={styles.makeClient}>
                  Make client
                </button>
              </form>
            )}
          </div>

          <form action={setInquiryStatus} className={styles.statusForm}>
            <input type="hidden" name="id" value={inquiry.id} />
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Status</legend>
              <div className={styles.statusOptions}>
                {INQUIRY_STATUSES.map((status) => {
                  const current = status === inquiry.status;
                  return (
                    <button
                      key={status}
                      type="submit"
                      name="status"
                      value={status}
                      className={styles.statusOption}
                      aria-pressed={current}
                      disabled={current}
                    >
                      {INQUIRY_STATUS_LABELS[status]}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </form>
        </aside>
      </div>
    </div>
  );
}
