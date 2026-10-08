import Link from "next/link";

import type { PortalProjectSummary } from "@/db/queries/portal";
import { portalProjectHref } from "@/lib/portal/routes";
import { describeTaskProgress, percentOf } from "@/lib/portal/progress";
import { PROJECT_CATEGORY_LABELS } from "@/lib/projects/status";
import { formatDueDate, isOverdue } from "@/lib/workspace/progress";

import { PortalStatusBadge } from "./PortalStatusBadge";
import { ProgressBar } from "./ProgressBar";
import styles from "./ProjectCard.module.css";

type ProjectCardProps = {
  project: PortalProjectSummary;
  /** Today in UTC (`YYYY-MM-DD`), passed in so every card uses the same date. */
  today: string;
};

/**
 * One project on the portal home: status, title, progress and what comes next.
 * The title's link stretches over the whole card.
 */
export function ProjectCard({ project, today }: ProjectCardProps) {
  const percent = percentOf(project.tasksDone, project.tasksTotal);
  const completed = project.workStatus === "completed";
  const late = isOverdue(project.nextMilestoneDueOn, today, false);
  const titleId = `project-${project.id}`;

  return (
    <article className={styles.card} aria-labelledby={titleId} data-completed={completed || undefined}>
      <span className={styles.corners} aria-hidden="true" />

      <div className={styles.top}>
        <PortalStatusBadge status={project.workStatus} />
        <span className={styles.kind}>
          {PROJECT_CATEGORY_LABELS[project.category]} · {project.year}
        </span>
      </div>

      <h3 id={titleId} className={styles.title}>
        <Link href={portalProjectHref(project.id)} className={styles.link}>
          {project.title}
        </Link>
      </h3>

      <div className={styles.progress}>
        {project.tasksTotal === 0 ? (
          <p className={styles.count}>{describeTaskProgress(0, 0)}</p>
        ) : (
          <>
            <p className={styles.figures}>
              <span className={styles.percent}>
                {percent}
                <span className={styles.percentSign}>%</span>
              </span>
              <span className={styles.count}>{describeTaskProgress(project.tasksDone, project.tasksTotal)}</span>
            </p>
            <ProgressBar percent={percent} muted={completed} />
          </>
        )}
      </div>

      {completed ? null : (
        <dl className={styles.next}>
          <dt>Next milestone</dt>
          <dd>
            {project.nextMilestoneTitle === null ? (
              <span className={styles.muted}>None scheduled</span>
            ) : (
              <>
                <span className={styles.nextTitle}>{project.nextMilestoneTitle}</span>
                {project.nextMilestoneDueOn === null ? null : (
                  <span className={late ? styles.late : styles.due}>
                    {late ? "Overdue · was due " : "Due "}
                    {formatDueDate(project.nextMilestoneDueOn, today)}
                  </span>
                )}
              </>
            )}
          </dd>
        </dl>
      )}

      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.arrow}>
        <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </article>
  );
}
