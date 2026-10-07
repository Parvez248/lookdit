import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientStatusBadge, ProjectStatusBadge, StatusBadge } from "@/components/admin/StatusBadge";
import { listClientProjects } from "@/db/queries/admin-projects";
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
  const [client, inquiries, projects] = await Promise.all([
    getClient(id),
    listClientInquiries(id),
    listClientProjects(id),
  ]);
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

          <section className={detail.section} aria-labelledby="notes-title">
            <h2 id="notes-title" className={detail.sectionTitle}>
              Notes
            </h2>
            {client.notes ? (
              <p className={styles.notes}>{client.notes}</p>
            ) : (
              <p className={detail.muted}>No notes yet.</p>
            )}
          </section>

          <section className={detail.section} aria-labelledby="client-projects-title">
            <h2 id="client-projects-title" className={detail.sectionTitle}>
              Projects
            </h2>
            {projects.length > 0 ? (
              <ol className={styles.records}>
                {projects.map((project) => (
                  <li key={project.id} className={styles.record}>
                    <Link href={`/admin/projects/${project.id}`} className={styles.recordLink}>
                      {project.title}
                    </Link>
                    <ProjectStatusBadge status={project.workStatus} />
                  </li>
                ))}
              </ol>
            ) : (
              <p className={detail.muted}>
                None yet.{" "}
                <Link href={`/admin/projects/new?client=${client.id}`} className={styles.inlineLink}>
                  Add a project for this client
                </Link>
              </p>
            )}
          </section>

          <section className={detail.section} aria-labelledby="client-inquiries-title">
            <h2 id="client-inquiries-title" className={detail.sectionTitle}>
              Inquiries
            </h2>
            {inquiries.length > 0 ? (
              <ol className={styles.records}>
                {inquiries.map((inquiry) => (
                  <li key={inquiry.id} className={styles.record}>
                    <Link href={`/admin/inquiries/${inquiry.id}`} className={styles.recordLink}>
                      <time dateTime={inquiry.createdAt.toISOString()}>{formatDateUtc(inquiry.createdAt)}</time>
                    </Link>
                    <StatusBadge status={inquiry.status} />
                    <p className={styles.preview}>{inquiry.preview}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={detail.muted}>None linked. Use “Make client” on an inquiry to link it here.</p>
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
                  <span className={detail.muted}>Not set</span>
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
                  <span className={detail.muted}>Not set</span>
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
                  <span className={detail.muted}>Not set</span>
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

          <Link href={`/admin/clients/${client.id}/edit`} className={detail.edit}>
            Edit client
          </Link>
        </aside>
      </div>
    </div>
  );
}
