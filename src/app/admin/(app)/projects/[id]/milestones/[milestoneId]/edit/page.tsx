import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { removeMilestone } from "@/app/actions/admin-workspace";
import { DeleteDisclosure } from "@/components/admin/workspace/DeleteDisclosure";
import { WorkspaceEditForm } from "@/components/admin/workspace/WorkspaceEditForm";
import { getMilestone } from "@/db/queries/project-workspace";
import { requireUser } from "@/lib/auth/session";
import { isProjectId } from "@/lib/projects/status";
import { isWorkspaceId } from "@/lib/workspace/status";

import styles from "@/components/admin/AdminFormPage.module.css";

export const metadata: Metadata = {
  title: "Edit milestone",
};

export default async function EditMilestonePage({
  params,
}: PageProps<"/admin/projects/[id]/milestones/[milestoneId]/edit">) {
  await requireUser();
  const { id, milestoneId } = await params;
  if (!isProjectId(id) || !isWorkspaceId(milestoneId)) notFound();
  const milestone = await getMilestone(id, milestoneId);
  if (milestone === null) notFound();
  const projectHref = `/admin/projects/${id}`;

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Edit milestone</h1>
      <WorkspaceEditForm
        kind="milestone"
        projectId={id}
        milestoneId={milestone.id}
        initial={{ title: milestone.title, dueOn: milestone.dueOn ?? "" }}
        cancelHref={projectHref}
      />
      <DeleteDisclosure
        action={removeMilestone}
        fields={{ projectId: id, milestoneId: milestone.id }}
        summary="Delete this milestone"
        body="Its tasks stay on the project, under Other tasks."
        confirm="Delete milestone"
      />
    </div>
  );
}
