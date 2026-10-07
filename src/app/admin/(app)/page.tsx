import type { Metadata } from "next";
import Link from "next/link";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { countProjectsByWorkStatus } from "@/db/queries/admin-projects";
import { countClientsByStatus } from "@/db/queries/clients";
import { countInquiriesByStatus, listInquiries } from "@/db/queries/inquiries";
import { adminRoutes } from "@/lib/auth/routes";
import { requireUser } from "@/lib/auth/session";
import { formatDateUtc } from "@/lib/format-date";
import { CLIENT_STATUSES, clientListHref } from "@/lib/clients/status";
import { INQUIRY_STATUSES, inquiryListHref } from "@/lib/inquiries/status";
import { projectListHref, WORK_STATUSES } from "@/lib/projects/status";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Dashboard",
};

const LATEST_COUNT = 4;

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name.trim().split(/\s+/)[0];
  const [counts, recent, clientCounts, projectCounts] = await Promise.all([
    countInquiriesByStatus(),
    listInquiries(null, 1),
    countClientsByStatus(),
    countProjectsByWorkStatus(),
  ]);
  const latest = recent.slice(0, LATEST_COUNT);
  const total = INQUIRY_STATUSES.reduce((sum, status) => sum + counts[status], 0);
  const stats = [
    { label: "New", href: inquiryListHref("new"), value: counts.new },
    { label: "Reviewing", href: inquiryListHref("reviewing"), value: counts.reviewing },
    { label: "Replied", href: inquiryListHref("replied"), value: counts.replied },
    { label: "All time", href: inquiryListHref(null), value: total },
  ] as const;
  const clientStats = [
    { label: "Leads", href: clientListHref("lead"), value: clientCounts.lead },
    { label: "Active", href: clientListHref("active"), value: clientCounts.active },
    { label: "Past", href: clientListHref("past"), value: clientCounts.past },
    { label: "All", href: clientListHref(null), value: CLIENT_STATUSES.reduce((sum, status) => sum + clientCounts[status], 0) },
  ] as const;
  const projectStats = [
    { label: "Active", href: projectListHref("active"), value: projectCounts.active },
    { label: "Planned", href: projectListHref("planned"), value: projectCounts.planned },
    { label: "On hold", href: projectListHref("on_hold"), value: projectCounts.on_hold },
    { label: "All", href: projectListHref(null), value: WORK_STATUSES.reduce((sum, status) => sum + projectCounts[status], 0) },
  ] as const;

  return (
    <div className={`container ${styles.page}`}>
      <SectionLabel>Dashboard</SectionLabel>
      <h1 className={styles.title}>Welcome back, {firstName}.</h1>
      <p className={styles.lede}>
        {counts.new === 0
          ? "No new inquiries waiting."
          : `${counts.new} new ${counts.new === 1 ? "inquiry is" : "inquiries are"} waiting for a first look.`}
      </p>

      <div className={styles.overview}>
        <OverviewRow id="inquiries" title="Inquiries" href={adminRoutes.inquiries} stats={stats} />
        <OverviewRow id="clients" title="Clients" href={adminRoutes.clients} stats={clientStats} />
        <OverviewRow id="projects" title="Projects" href={adminRoutes.projects} stats={projectStats} />
      </div>

      <section className={styles.latestSection} aria-labelledby="latest-title">
        <div className={styles.sectionHead}>
          <h2 id="latest-title" className={styles.sectionTitle}>
            Latest inquiries
          </h2>
          <Link href={adminRoutes.inquiries} className={styles.sectionLink}>
            View all<span className="visually-hidden"> inquiries</span>
          </Link>
        </div>
        {latest.length > 0 ? (
          <ol className={styles.latest}>
            {latest.map((inquiry) => (
              <li key={inquiry.id} className={styles.latestItem}>
                <Link href={`/admin/inquiries/${inquiry.id}`} className={styles.latestLink}>
                  {inquiry.name}
                </Link>
                <span className={styles.latestOrg}>{inquiry.company ?? inquiry.email}</span>
                <span className={styles.latestStatus}>
                  <StatusBadge status={inquiry.status} />
                </span>
                <time dateTime={inquiry.createdAt.toISOString()} className={styles.latestDate}>
                  {formatDateUtc(inquiry.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.none}>No inquiries yet. New requests from the contact form appear here.</p>
        )}
      </section>
    </div>
  );
}

type OverviewStat = { label: string; value: number; href: string };

/** One line of the overview: a heading, its counts (each opens the filtered list) and "View all". */
function OverviewRow({
  id,
  title,
  href,
  stats,
}: {
  id: string;
  title: string;
  href: string;
  stats: readonly OverviewStat[];
}) {
  return (
    <section className={styles.row} aria-labelledby={`${id}-title`}>
      <div className={styles.rowHead}>
        <h2 id={`${id}-title`} className={styles.rowTitle}>
          {title}
        </h2>
        <Link href={href} className={styles.sectionLink}>
          View all<span className="visually-hidden"> {title.toLowerCase()}</span>
        </Link>
      </div>
      <ul className={styles.stats} aria-label={`${title} by status`}>
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link href={stat.href} className={styles.stat}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
