import type { Metadata } from "next";
import Link from "next/link";

import { FilterTabs } from "@/components/admin/FilterTabs";
import { Pagination } from "@/components/admin/Pagination";
import { ProjectStatusBadge } from "@/components/admin/StatusBadge";
import { countProjectsByWorkStatus, listProjects } from "@/db/queries/admin-projects";
import { requireUser } from "@/lib/auth/session";
import { formatDateUtc } from "@/lib/format-date";
import {
  PROJECT_CATEGORY_LABELS,
  PROJECTS_PAGE_SIZE,
  parseProjectListParams,
  projectListHref,
  WORK_STATUS_LABELS,
  WORK_STATUSES,
} from "@/lib/projects/status";

import list from "@/components/admin/AdminList.module.css";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  await requireUser();
  const { status, page } = parseProjectListParams(await searchParams);
  const [counts, items] = await Promise.all([countProjectsByWorkStatus(), listProjects(status, page)]);

  const total = WORK_STATUSES.reduce((sum, s) => sum + counts[s], 0);
  const pageCount = Math.max(1, Math.ceil((status ? counts[status] : total) / PROJECTS_PAGE_SIZE));
  const tabs = [
    { label: "All", href: projectListHref(null), count: total, current: status === null },
    ...WORK_STATUSES.map((s) => ({
      label: WORK_STATUS_LABELS[s],
      href: projectListHref(s),
      count: counts[s],
      current: status === s,
    })),
  ];

  return (
    <div className={`container ${list.page}`}>
      <header className={list.intro}>
        <div>
          <h1 className={list.title}>Projects</h1>
          <p className={list.lede}>LOOKDIT&rsquo;s work, most recently updated first.</p>
        </div>
        <Link href="/admin/projects/new" className={list.add}>
          Add project
        </Link>
      </header>

      <FilterTabs label="Filter by status" tabs={tabs} />

      {items.length > 0 ? (
        <ol className={list.list}>
          {items.map((project) => (
            <li key={project.id} className={list.item}>
              <div className={list.who}>
                <h2 className={list.name}>
                  <Link href={`/admin/projects/${project.id}`} className={list.link}>
                    {project.title}
                  </Link>
                </h2>
                <p className={list.sub}>{project.clientName ?? "No client"}</p>
              </div>
              <p className={styles.kind}>
                {PROJECT_CATEGORY_LABELS[project.category]}
                {project.publicStatus === "published" ? <span className={styles.public}>On the site</span> : null}
              </p>
              <div className={list.meta}>
                <ProjectStatusBadge status={project.workStatus} />
                <span className={list.date}>
                  <span className="visually-hidden">Updated </span>
                  <time dateTime={project.updatedAt.toISOString()}>{formatDateUtc(project.updatedAt)}</time>
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
                ? `No ${WORK_STATUS_LABELS[status].toLowerCase()} projects.`
                : "No projects yet."}
          </p>
          <p className={list.emptyBody}>
            {page > 1 ? (
              <Link href={projectListHref(status)} className={list.textLink}>
                Go to the first page
              </Link>
            ) : (
              <Link href="/admin/projects/new" className={list.textLink}>
                Add a project
              </Link>
            )}
          </p>
        </div>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        href={(target) => projectListHref(status, target)}
        previousLabel="Previous"
        nextLabel="Next"
      />
    </div>
  );
}
