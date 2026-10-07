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
    { label: "New", status: "new", value: counts.new },
    { label: "Reviewing", status: "reviewing", value: counts.reviewing },
    { label: "Replied", status: "replied", value: counts.replied },
    { label: "All time", status: null, value: total },
  ] as const;
  const clientStats = [
    { label: "Leads", status: "lead", value: clientCounts.lead },
    { label: "Active", status: "active", value: clientCounts.active },
    { label: "Past", status: "past", value: clientCounts.past },
    { label: "All", status: null, value: CLIENT_STATUSES.reduce((sum, status) => sum + clientCounts[status], 0) },
  ] as const;
  const projectStats = [
    { label: "Active", status: "active", value: projectCounts.active },
    { label: "Planned", status: "planned", value: projectCounts.planned },
    { label: "On hold", status: "on_hold", value: projectCounts.on_hold },
    { label: "All", status: null, value: WORK_STATUSES.reduce((sum, status) => sum + projectCounts[status], 0) },
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

      <section className={`${styles.panel} ${styles.first}`} aria-labelledby="inquiries-title">
        <div className={styles.inquiriesHead}>
          <h2 id="inquiries-title" className={styles.sectionTitle}>
            Inquiries
          </h2>
          <Link href={adminRoutes.inquiries} className={styles.sectionLink}>
            View all
          </Link>
        </div>

        <ul className={styles.stats} aria-label="Inquiries by status">
          {stats.map((stat) => (
            <li key={stat.label}>
              <Link href={inquiryListHref(stat.status)} className={styles.stat}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
              </Link>
            </li>
          ))}
        </ul>

        {latest.length > 0 ? (
          <ol className={styles.latest} aria-label="Latest inquiries">
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

      <section className={styles.panel} aria-labelledby="clients-title">
        <div className={styles.inquiriesHead}>
          <h2 id="clients-title" className={styles.sectionTitle}>
            Clients
          </h2>
          <Link href={adminRoutes.clients} className={styles.sectionLink}>
            View all
          </Link>
        </div>
        <ul className={styles.stats} aria-label="Clients by status">
          {clientStats.map((stat) => (
            <li key={stat.label}>
              <Link href={clientListHref(stat.status)} className={styles.stat}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel} aria-labelledby="projects-title">
        <div className={styles.inquiriesHead}>
          <h2 id="projects-title" className={styles.sectionTitle}>
            Projects
          </h2>
          <Link href={adminRoutes.projects} className={styles.sectionLink}>
            View all
          </Link>
        </div>
        <ul className={styles.stats} aria-label="Projects by status">
          {projectStats.map((stat) => (
            <li key={stat.label}>
              <Link href={projectListHref(stat.status)} className={styles.stat}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
