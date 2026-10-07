import type { Metadata } from "next";
import Link from "next/link";

import { FilterTabs } from "@/components/admin/FilterTabs";
import { Pagination } from "@/components/admin/Pagination";
import { ClientStatusBadge } from "@/components/admin/StatusBadge";
import { countClientsByStatus, listClients } from "@/db/queries/clients";
import { requireUser } from "@/lib/auth/session";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUSES,
  CLIENTS_PAGE_SIZE,
  clientListHref,
  parseClientListParams,
} from "@/lib/clients/status";
import { formatDateUtc } from "@/lib/format-date";

import list from "@/components/admin/AdminList.module.css";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Clients",
};

export default async function ClientsPage({ searchParams }: PageProps<"/admin/clients">) {
  await requireUser();
  const { status, page } = parseClientListParams(await searchParams);
  const [counts, items] = await Promise.all([countClientsByStatus(), listClients(status, page)]);

  const total = CLIENT_STATUSES.reduce((sum, s) => sum + counts[s], 0);
  const pageCount = Math.max(1, Math.ceil((status ? counts[status] : total) / CLIENTS_PAGE_SIZE));
  const tabs = [
    { label: "All", href: clientListHref(null), count: total, current: status === null },
    ...CLIENT_STATUSES.map((s) => ({
      label: CLIENT_STATUS_LABELS[s],
      href: clientListHref(s),
      count: counts[s],
      current: status === s,
    })),
  ];

  return (
    <div className={`container ${list.page}`}>
      <header className={list.intro}>
        <div>
          <h1 className={list.title}>Clients</h1>
          <p className={list.lede}>The people and companies LOOKDIT works with, A to Z.</p>
        </div>
        <Link href="/admin/clients/new" className={list.add}>
          Add client
        </Link>
      </header>

      <FilterTabs label="Filter by status" tabs={tabs} />

      {items.length > 0 ? (
        <ol className={list.list}>
          {items.map((client) => (
            <li key={client.id} className={list.item}>
              <div className={list.who}>
                <h2 className={list.name}>
                  <Link href={`/admin/clients/${client.id}`} className={list.link}>
                    {client.name}
                  </Link>
                </h2>
                {client.company ? <p className={list.sub}>{client.company}</p> : null}
              </div>
              <p className={styles.email}>{client.email ?? "No email"}</p>
              <div className={list.meta}>
                <ClientStatusBadge status={client.status} />
                <span className={list.date}>
                  <span className="visually-hidden">Updated </span>
                  <time dateTime={client.updatedAt.toISOString()}>{formatDateUtc(client.updatedAt)}</time>
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className={list.empty}>
          <p className={list.emptyTitle}>
            {page > 1
              ? "There's nothing on this page."
              : status
                ? `No ${CLIENT_STATUS_LABELS[status].toLowerCase()} clients.`
                : "No clients yet."}
          </p>
          <p className={list.emptyBody}>
            {page > 1 ? (
              <Link href={clientListHref(status)} className={list.textLink}>
                Go to the first page
              </Link>
            ) : (
              "Add one here, or use “Make client” on an inquiry."
            )}
          </p>
        </div>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        href={(target) => clientListHref(status, target)}
        previousLabel="Previous"
        nextLabel="Next"
      />
    </div>
  );
}
