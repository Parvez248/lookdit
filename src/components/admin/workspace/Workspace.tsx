import Link from "next/link";

import { changeMilestoneCompleted, changeTaskStatus } from "@/app/actions/admin-workspace";
import { TaskStatusBadge } from "@/components/admin/StatusBadge";
import type { MilestoneRow, TaskRow, Workspace as WorkspaceData } from "@/db/queries/project-workspace";
import { formatDueDate, isOverdue, nextMilestone, progressOf, todayUtc, type Progress } from "@/lib/workspace/progress";
import { NEXT_TASK_STEP } from "@/lib/workspace/status";

import { InlineAdd } from "./InlineAdd";
import styles from "./Workspace.module.css";

type WorkspaceProps = { projectId: string; data: WorkspaceData };

/**
 * The project page's workspace: overall progress, then each milestone with its
 * tasks, then tasks without a milestone. Server-rendered; every button is a
 * plain form posting to a Server Action, so it all works without JavaScript.
 */
export function Workspace({ projectId, data }: WorkspaceProps) {
  const today = todayUtc();
  const overall = progressOf(data.tasks);
  const open = data.tasks.filter((task) => task.status !== "done");
  const overdue = open.filter((task) => isOverdue(task.dueOn, today, false)).length;
  const next = nextMilestone(data.milestones);

  // Group tasks by milestone in one pass (a Map, so it stays linear).
  const byMilestone = new Map<string | null, TaskRow[]>();
  for (const task of data.tasks) {
    const group = byMilestone.get(task.milestoneId) ?? [];
    group.push(task);
    byMilestone.set(task.milestoneId, group);
  }
  const loose = byMilestone.get(null) ?? [];

  return (
    <section className={styles.workspace} aria-labelledby="workspace-title">
      <h2 id="workspace-title" className={styles.heading}>
        Work
      </h2>

      <div className={styles.overview}>
        <div className={styles.overviewHead}>
          <p className={styles.percent}>
            {overall.percent}
            <span className={styles.percentSign}>%</span>
          </p>
          <p className={styles.overviewText}>
            {overall.total === 0
              ? "No tasks yet. Add milestones and tasks below."
              : `${overall.done} of ${overall.total} ${overall.total === 1 ? "task" : "tasks"} done`}
          </p>
        </div>
        <Bar progress={overall} large />
        <dl className={styles.facts}>
          <div>
            <dt>Next milestone</dt>
            <dd>
              {next ? (
                <a href={`#milestone-${next.id}`} className={styles.factLink}>
                  {next.title}
                  {next.dueOn ? <span className={styles.factMeta}> · {formatDueDate(next.dueOn, today)}</span> : null}
                </a>
              ) : (
                <span className={styles.factMuted}>None open</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Open tasks</dt>
            <dd>{open.length}</dd>
          </div>
          <div>
            <dt>Overdue</dt>
            <dd>{overdue === 0 ? <span className={styles.factMuted}>None</span> : overdue}</dd>
          </div>
        </dl>
      </div>

      {data.milestones.map((milestone) => (
        <MilestoneGroup
          key={milestone.id}
          projectId={projectId}
          milestone={milestone}
          tasks={byMilestone.get(milestone.id) ?? []}
          today={today}
        />
      ))}

      <section className={styles.group} aria-labelledby="loose-title">
        <div className={styles.groupHead}>
          <h3 id="loose-title" className={styles.groupTitle}>
            {data.milestones.length > 0 ? "Other tasks" : "Tasks"}
          </h3>
          {loose.length > 0 ? <p className={styles.count}>{progressOf(loose).done}/{loose.length}</p> : null}
        </div>
        <TaskList projectId={projectId} tasks={loose} today={today} />
        <InlineAdd kind="task" projectId={projectId} label="Add a task without a milestone" />
      </section>

      <div className={styles.newMilestone}>
        <h3 className={styles.newMilestoneTitle}>New milestone</h3>
        <p className={styles.newMilestoneHint}>A phase of the work, like Discovery, Design or Launch.</p>
        <InlineAdd kind="milestone" projectId={projectId} label="Milestone title" />
      </div>
    </section>
  );
}

function MilestoneGroup({
  projectId,
  milestone,
  tasks,
  today,
}: {
  projectId: string;
  milestone: MilestoneRow;
  tasks: TaskRow[];
  today: string;
}) {
  const done = milestone.completedAt !== null;
  const progress = progressOf(tasks);
  const late = isOverdue(milestone.dueOn, today, done);
  const titleId = `milestone-${milestone.id}-title`;

  return (
    <section id={`milestone-${milestone.id}`} className={styles.group} data-done={done || undefined} aria-labelledby={titleId}>
      <div className={styles.groupHead}>
        <h3 id={titleId} className={styles.groupTitle}>
          {milestone.title}
        </h3>
        <p className={styles.groupMeta}>
          {done ? (
            <span className={styles.doneTag}>Done</span>
          ) : milestone.dueOn ? (
            <span className={late ? styles.late : undefined}>
              {late ? "Overdue · " : "Due "}
              {formatDueDate(milestone.dueOn, today)}
            </span>
          ) : null}
          {tasks.length > 0 ? (
            <span className={styles.count}>
              {progress.done}/{progress.total}
              <span className="visually-hidden"> tasks done</span>
            </span>
          ) : null}
        </p>
        <div className={styles.groupActions}>
          <form action={changeMilestoneCompleted}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="milestoneId" value={milestone.id} />
            <input type="hidden" name="completed" value={done ? "false" : "true"} />
            <button type="submit" className={styles.smallButton}>
              {done ? "Reopen" : "Mark done"}
              <span className="visually-hidden">: {milestone.title}</span>
            </button>
          </form>
          <Link href={`/admin/projects/${projectId}/milestones/${milestone.id}/edit`} className={styles.textAction}>
            Edit<span className="visually-hidden"> milestone {milestone.title}</span>
          </Link>
        </div>
      </div>
      {tasks.length > 0 ? <Bar progress={progress} /> : null}
      <TaskList projectId={projectId} tasks={tasks} today={today} />
      <InlineAdd kind="task" projectId={projectId} milestoneId={milestone.id} label={`Add a task to ${milestone.title}`} />
    </section>
  );
}

function TaskList({ projectId, tasks, today }: { projectId: string; tasks: TaskRow[]; today: string }) {
  if (tasks.length === 0) return null;
  return (
    <ul className={styles.tasks}>
      {tasks.map((task) => {
        const step = NEXT_TASK_STEP[task.status];
        const finished = task.status === "done";
        const late = isOverdue(task.dueOn, today, finished);
        return (
          <li key={task.id} className={styles.task} data-status={task.status}>
            <form action={changeTaskStatus} className={styles.stepForm}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="status" value={step.status} />
              <button type="submit" className={styles.step} data-step={step.status}>
                {step.label}
                <span className="visually-hidden">: {task.title}</span>
              </button>
            </form>
            <div className={styles.taskBody}>
              <p className={styles.taskTitle}>{task.title}</p>
              <p className={styles.taskMeta}>
                <TaskStatusBadge status={task.status} />
                {task.dueOn ? (
                  <span className={late ? styles.late : undefined}>
                    {late ? "Overdue · " : "Due "}
                    {formatDueDate(task.dueOn, today)}
                  </span>
                ) : null}
              </p>
            </div>
            <Link href={`/admin/projects/${projectId}/tasks/${task.id}/edit`} className={styles.textAction}>
              Edit<span className="visually-hidden"> task {task.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Decorative bar; the numbers next to it carry the meaning. */
function Bar({ progress, large = false }: { progress: Progress; large?: boolean }) {
  return (
    <div className={styles.bar} data-size={large ? "large" : undefined} aria-hidden="true">
      <div className={styles.barFill} style={{ width: `${progress.percent}%` }} />
    </div>
  );
}
