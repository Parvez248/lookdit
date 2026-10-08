import type { MilestoneRow, TaskRow } from "@/db/queries/project-workspace";
import { describeTaskProgress } from "@/lib/portal/progress";
import { formatDueDate, isOverdue, progressOf } from "@/lib/workspace/progress";
import { TASK_STATUS_LABELS } from "@/lib/workspace/status";

import styles from "./Timeline.module.css";

type MilestoneState = "done" | "overdue" | "next" | "upcoming";

type TimelineProps = {
  milestones: MilestoneRow[];
  /** Tasks grouped by milestone id. */
  tasksByMilestone: ReadonlyMap<string | null, TaskRow[]>;
  /** The milestone the overview calls "next", marked on the line. */
  nextId: string | null;
  today: string;
};

/**
 * The project's milestones as a vertical line, in due-date order, each with its
 * tasks. Read-only. State is always written out ("Done", "Overdue", "Next"), so
 * the markers' shape and colour only reinforce it.
 */
export function Timeline({ milestones, tasksByMilestone, nextId, today }: TimelineProps) {
  return (
    <ol className={styles.timeline}>
      {milestones.map((milestone) => {
        const done = milestone.completedAt !== null;
        const state: MilestoneState = done
          ? "done"
          : isOverdue(milestone.dueOn, today, false)
            ? "overdue"
            : milestone.id === nextId
              ? "next"
              : "upcoming";
        const tasks = tasksByMilestone.get(milestone.id) ?? [];
        const progress = progressOf(tasks);

        return (
          <li key={milestone.id} id={`milestone-${milestone.id}`} className={styles.milestone} data-state={state}>
            <span className={styles.node} aria-hidden="true" />
            <p className={styles.when}>{describeWhen(state, milestone, today)}</p>
            <h3 className={styles.title}>{milestone.title}</h3>
            {tasks.length > 0 ? (
              <p className={styles.count}>{describeTaskProgress(progress.done, progress.total)}</p>
            ) : null}
            {tasks.length === 0 ? null : done ? (
              // Finished milestones keep their tasks one click away, so open work leads.
              <details className={styles.disclosure}>
                <summary className={styles.summary}>
                  Show {tasks.length === 1 ? "the task" : `${tasks.length} tasks`}
                </summary>
                <TaskList tasks={tasks} today={today} />
              </details>
            ) : (
              <TaskList tasks={tasks} today={today} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function describeWhen(state: MilestoneState, milestone: MilestoneRow, today: string): string {
  if (state === "done" && milestone.completedAt !== null) {
    return `Done · ${formatDueDate(milestone.completedAt.toISOString().slice(0, 10), today)}`;
  }
  if (milestone.dueOn === null) return state === "next" ? "Next · no date yet" : "No date yet";
  const due = formatDueDate(milestone.dueOn, today);
  if (state === "overdue") return `Overdue · was due ${due}`;
  if (state === "next") return `Next · due ${due}`;
  return `Due ${due}`;
}

/** Read-only task rows: a status marker, the title, and status with due date. */
export function TaskList({ tasks, today }: { tasks: TaskRow[]; today: string }) {
  return (
    <ul className={styles.tasks}>
      {tasks.map((task) => {
        const done = task.status === "done";
        const late = isOverdue(task.dueOn, today, done);
        return (
          <li key={task.id} className={styles.task} data-status={task.status}>
            <span className={styles.mark} aria-hidden="true" />
            <span className={styles.taskTitle}>{task.title}</span>
            <span className={styles.taskMeta}>
              <span className={styles.taskStatus}>{TASK_STATUS_LABELS[task.status]}</span>
              {task.dueOn !== null && !done ? (
                <span className={late ? styles.late : styles.due}>
                  {late ? "Overdue · was due " : "Due "}
                  {formatDueDate(task.dueOn, today)}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
