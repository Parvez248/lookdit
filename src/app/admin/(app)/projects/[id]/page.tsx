import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { setProjectPublication } from "@/app/actions/admin-projects";
import { MediaManager } from "@/components/admin/media/MediaManager";
import { ProjectStatusBadge } from "@/components/admin/StatusBadge";
import { Workspace } from "@/components/admin/workspace/Workspace";
import { getProject, listProjectMedia } from "@/db/queries/admin-projects";
import { getWorkspace } from "@/db/queries/project-workspace";
import { requireUser } from "@/lib/auth/session";
import { formatDateTimeUtc } from "@/lib/format-date";
import {
  isProjectId,
  PROJECT_CATEGORY_LABELS,
  projectListHref,
  PUBLIC_STATUS_LABELS,
} from "@/lib/projects/status";

import detail from "@/components/admin/AdminDetail.module.css";

import styles from "./page.module.css";

// Generic title, so a project's name doesn't land in tab titles or history.
export const metadata: Metadata = {
  title: "Project",
};

export default async function ProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  await requireUser();
  const { id } = await params;
  if (!isProjectId(id)) notFound();
  const [project, workspace, media] = await Promise.all([getProject(id), getWorkspace(id), listProjectMedia(id)]);
  if (project === null) notFound();

  return (
    <div className={`container ${detail.page}`}>
      <Link href={projectListHref(null)} className={detail.back}>
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={detail.backIcon}>
          <path d="M13 8H3.5M7.5 4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        All projects
      </Link>

      <div className={detail.layout}>
        <article aria-labelledby="project-title">
          <header className={detail.header}>
            <ProjectStatusBadge status={project.workStatus} />
            <h1 id="project-title" className={detail.title}>
              {project.title}
            </h1>
            <p className={detail.company}>
              {project.clientName ?? "No client"} · {PROJECT_CATEGORY_LABELS[project.category]} · {project.year}
            </p>
          </header>

          <section className={detail.section} aria-labelledby="summary-title">
            <h2 id="summary-title" className={detail.sectionTitle}>
              Summary
            </h2>
            <p className={styles.summary}>{project.summary}</p>
          </section>

          <MediaManager projectId={project.id} media={media} />

          <Workspace projectId={project.id} data={workspace} />
        </article>

        <aside className={detail.side} aria-label="Project details">
          <dl className={detail.details}>
            <div>
              <dt>Client</dt>
              <dd>
                {project.clientId && project.clientName ? (
                  <Link href={`/admin/clients/${project.clientId}`} className={detail.email}>
                    {project.clientName}
                  </Link>
                ) : (
                  <span className={detail.muted}>Not set</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Public site</dt>
              <dd>
                {PUBLIC_STATUS_LABELS[project.publicStatus]}
                {project.publicStatus === "published" ? (
                  <>
                    {" · "}
                    <a
                      href={`/work/${project.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.viewLink}
                    >
                      View on site
                    </a>
                  </>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>Slug</dt>
              <dd className={styles.slug}>{project.slug}</dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>
                <time dateTime={project.createdAt.toISOString()}>{formatDateTimeUtc(project.createdAt)}</time>
              </dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>
                <time dateTime={project.updatedAt.toISOString()}>{formatDateTimeUtc(project.updatedAt)}</time>
              </dd>
            </div>
          </dl>

          <div className={styles.actions}>
            <Link href={`/admin/projects/${project.id}/edit`} className={detail.edit}>
              Edit project
            </Link>
            <form action={setProjectPublication}>
              <input type="hidden" name="id" value={project.id} />
              <input
                type="hidden"
                name="intent"
                value={project.publicStatus === "published" ? "unpublish" : "publish"}
              />
              <button
                type="submit"
                className={project.publicStatus === "published" ? styles.unpublish : styles.publish}
              >
                {project.publicStatus === "published" ? "Unpublish" : "Publish"}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
