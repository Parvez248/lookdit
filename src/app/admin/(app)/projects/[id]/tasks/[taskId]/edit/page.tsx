import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { removeTask } from "@/app/actions/admin-workspace";
import { DeleteDisclosure } from "@/components/admin/workspace/DeleteDisclosure";
import { WorkspaceEditForm } from "@/components/admin/workspace/WorkspaceEditForm";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { getTask, listMilestoneOptions } from "@/db/queries/project-workspace";
import { requireUser } from "@/lib/auth/session";
import { isProjectId } from "@/lib/projects/status";
import { isWorkspaceId } from "@/lib/workspace/status";

import styles from "@/components/admin/AdminFormPage.module.css";

export const metadata: Metadata = {
  title: "Edit task",
};

export default async function EditTaskPage({ params }: PageProps<"/admin/projects/[id]/tasks/[taskId]/edit">) {
  await requireUser();
  const { id, taskId } = await params;
  if (!isProjectId(id) || !isWorkspaceId(taskId)) notFound();
  const [task, milestones] = await Promise.all([getTask(id, taskId), listMilestoneOptions(id)]);
  if (task === null) notFound();
  const projectHref = `/admin/projects/${id}`;

  return (
    <div className={`container ${styles.page}`}>
      <SectionLabel>Projects</SectionLabel>
      <h1 className={styles.title}>Edit task</h1>
      <WorkspaceEditForm
        kind="task"
        projectId={id}
        taskId={task.id}
        initial={{ title: task.title, dueOn: task.dueOn ?? "", milestoneId: task.milestoneId ?? "", status: task.status }}
        milestones={milestones}
        cancelHref={projectHref}
      />
      <DeleteDisclosure
        action={removeTask}
        fields={{ projectId: id, taskId: task.id }}
        summary="Delete this task"
        body="This can't be undone."
        confirm="Delete task"
      />
    </div>
  );
}
