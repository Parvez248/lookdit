import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientStatusBadge, StatusBadge } from "@/components/admin/StatusBadge";
import { getClient, listClientInquiries } from "@/db/queries/clients";
import { requireUser } from "@/lib/auth/session";
import { clientListHref, isClientId } from "@/lib/clients/status";
import { formatDateTimeUtc, formatDateUtc } from "@/lib/format-date";

import detail from "@/components/admin/AdminDetail.module.css";

import styles from "./page.module.css";

// Generic title, so a client's name doesn't land in tab titles or history.
export const metadata: Metadata = {
  title: "Client",
};

export default async function ClientPage({ params }: PageProps<"/admin/clients/[id]">) {
  await requireUser();
  const { id } = await params;
  if (!isClientId(id)) notFound();
  const [client, inquiries] = await Promise.all([getClient(id), listClientInquiries(id)]);
  if (client === null) notFound();

  return (
    <div className={`container ${detail.page}`}>
      <Link href={clientListHref(null)} className={detail.back}>
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={detail.backIcon}>
          <path d="M13 8H3.5M7.5 4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        All clients
      </Link>

      <div className={detail.layout}>
        <article className={detail.main} aria-labelledby="client-title">
          <header className={detail.header}>
            <ClientStatusBadge status={client.status} />
            <h1 id="client-title" className={detail.title}>
              {client.name}
            </h1>
            {client.company ? <p className={detail.company}>{client.company}</p> : null}
          </header>

          <section className={styles.section} aria-labelledby="notes-title">
            <h2 id="notes-title" className={styles.sectionTitle}>
              Notes
            </h2>
            {client.notes ? (
              <p className={styles.notes}>{client.notes}</p>
            ) : (
              <p className={styles.muted}>No notes yet.</p>
            )}
          </section>

          <section className={styles.section} aria-labelledby="client-inquiries-title">
            <h2 id="client-inquiries-title" className={styles.sectionTitle}>
              Inquiries
            </h2>
            {inquiries.length > 0 ? (
              <ol className={styles.inquiries}>
                {inquiries.map((inquiry) => (
                  <li key={inquiry.id} className={styles.inquiry}>
                    <Link href={`/admin/inquiries/${inquiry.id}`} className={styles.inquiryLink}>
                      <time dateTime={inquiry.createdAt.toISOString()}>{formatDateUtc(inquiry.createdAt)}</time>
                    </Link>
                    <StatusBadge status={inquiry.status} />
                    <p className={styles.preview}>{inquiry.preview}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.muted}>None linked. Use “Make client” on an inquiry to link it here.</p>
            )}
          </section>
        </article>

        <aside className={detail.side} aria-label="Contact details">
          <dl className={detail.details}>
            <div>
              <dt>Email</dt>
              <dd>
                {client.email ? (
                  <a href={`mailto:${client.email}`} className={detail.email}>
                    {client.email}
                  </a>
                ) : (
                  <span className={styles.muted}>Not set</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                {client.phone ? (
                  <a href={`tel:${client.phone.replace(/[^\d+]/g, "")}`} className={detail.email}>
                    {client.phone}
                  </a>
                ) : (
                  <span className={styles.muted}>Not set</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>
                {client.website && /^https?:\/\//.test(client.website) ? (
                  <a href={client.website} className={detail.email} target="_blank" rel="noopener noreferrer">
                    {client.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <span className="visually-hidden"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <span className={styles.muted}>Not set</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>
                <time dateTime={client.createdAt.toISOString()}>{formatDateTimeUtc(client.createdAt)}</time>
              </dd>
            </div>
          </dl>

          <Link href={`/admin/clients/${client.id}/edit`} className={styles.edit}>
            Edit client
          </Link>
        </aside>
      </div>
    </div>
  );
}
