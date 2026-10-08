import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PortalStatusBadge } from "@/components/portal/PortalStatusBadge";
import { ProgressBar } from "@/components/portal/ProgressBar";
import { TaskList, Timeline } from "@/components/portal/Timeline";
import { getPortalProjectView } from "@/db/queries/portal";
import type { TaskRow } from "@/db/queries/project-workspace";
import { describeTaskProgress } from "@/lib/portal/progress";
import { portalRoutes } from "@/lib/portal/routes";
import { requireClient } from "@/lib/portal/session";
import { isProjectId, PROJECT_CATEGORY_LABELS } from "@/lib/projects/status";
import { formatDueDate, isOverdue, nextMilestone, progressOf, todayUtc } from "@/lib/workspace/progress";

import styles from "./page.module.css";

// Generic title, so a project's name doesn't land in tab titles or history.
export const metadata: Metadata = {
  title: "Project",
};

export default async function PortalProjectPage({ params }: PageProps<"/portal/projects/[id]">) {
  const client = await requireClient();
  const { id } = await params;
  if (!isProjectId(id)) notFound();
  // Scoped to the signed-in client in SQL: someone else's project is a 404, like a missing one.
  const view = await getPortalProjectView(client.clientId, id);
  if (view === null) notFound();
  const { project, workspace } = view;

  const today = todayUtc();
  const overall = progressOf(workspace.tasks);
  const next = nextMilestone(workspace.milestones);
  const milestonesDone = workspace.milestones.filter((milestone) => milestone.completedAt !== null).length;
  const overdueTasks = workspace.tasks.filter((task) => isOverdue(task.dueOn, today, task.status === "done")).length;
  const nextLate = next !== null && isOverdue(next.dueOn, today, false);

  // Group tasks by milestone in one pass (a Map, so it stays linear).
  const tasksByMilestone = new Map<string | null, TaskRow[]>();
  for (const task of workspace.tasks) {
    const group = tasksByMilestone.get(task.milestoneId) ?? [];
    group.push(task);
    tasksByMilestone.set(task.milestoneId, group);
  }
  const loose = tasksByMilestone.get(null) ?? [];
  const empty = workspace.milestones.length === 0 && workspace.tasks.length === 0;

  return (
    <div className={`container ${styles.page}`}>
      <Link href={portalRoutes.home} className={styles.back}>
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.backIcon}>
          <path d="M13 8H3.5M7.5 4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        All projects
      </Link>

      <header className={styles.head}>
        <div className={styles.headMeta}>
          <PortalStatusBadge status={project.workStatus} />
          <span className={styles.kind}>
            {PROJECT_CATEGORY_LABELS[project.category]} · {project.year}
          </span>
        </div>
        <h1 className={styles.title}>{project.title}</h1>
        <p className={styles.summary}>{project.summary}</p>
      </header>

      <div className={styles.layout}>
        <section className={styles.overview} aria-labelledby="progress-title">
          <h2 id="progress-title" className={styles.label}>
            Progress
          </h2>
          <p className={styles.percent}>
            {overall.percent}
            <span className={styles.percentSign}>%</span>
          </p>
          <p className={styles.overviewText}>{describeTaskProgress(overall.done, overall.total)}</p>
          <ProgressBar percent={overall.percent} size="large" />

          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>Next milestone</dt>
              <dd>
                {next === null ? (
                  <span className={styles.muted}>{milestonesDone > 0 ? "All milestones done" : "None scheduled"}</span>
                ) : (
                  <a href={`#milestone-${next.id}`} className={styles.factLink}>
                    {next.title}
                    {next.dueOn === null ? null : (
                      <span className={nextLate ? styles.late : styles.factMeta}>
                        {nextLate ? "Overdue · was due " : "Due "}
                        {formatDueDate(next.dueOn, today)}
                      </span>
                    )}
                  </a>
                )}
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>Milestones</dt>
              <dd>
                {workspace.milestones.length === 0 ? (
                  <span className={styles.muted}>None yet</span>
                ) : (
                  `${milestonesDone} of ${workspace.milestones.length} done`
                )}
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>Overdue tasks</dt>
              <dd>{overdueTasks === 0 ? <span className={styles.muted}>None</span> : overdueTasks}</dd>
            </div>
          </dl>
        </section>

        <div className={styles.plan}>
          {empty ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>The plan is being prepared.</p>
              <p className={styles.emptyBody}>Milestones and tasks appear here once LOOKDIT sets them out.</p>
            </div>
          ) : null}

          {workspace.milestones.length > 0 ? (
            <section aria-labelledby="milestones-title">
              <h2 id="milestones-title" className={styles.label}>
                Milestones
              </h2>
              <div className={styles.sectionBody}>
                <Timeline
                  milestones={workspace.milestones}
                  tasksByMilestone={tasksByMilestone}
                  nextId={next?.id ?? null}
                  today={today}
                />
              </div>
            </section>
          ) : null}

          {loose.length > 0 ? (
            <section className={styles.other} aria-labelledby="other-title">
              <h2 id="other-title" className={styles.label}>
                {workspace.milestones.length > 0 ? "Other tasks" : "Tasks"}
              </h2>
              <TaskList tasks={loose} today={today} />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
