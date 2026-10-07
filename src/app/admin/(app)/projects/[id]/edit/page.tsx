import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/admin/ProjectForm";
import { getProject, listClientOptions } from "@/db/queries/admin-projects";
import { requireUser } from "@/lib/auth/session";
import { isProjectId } from "@/lib/projects/status";

import styles from "@/components/admin/AdminFormPage.module.css";

export const metadata: Metadata = {
  title: "Edit project",
};

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]/edit">) {
  await requireUser();
  const { id } = await params;
  if (!isProjectId(id)) notFound();
  const [project, clients] = await Promise.all([getProject(id), listClientOptions()]);
  if (project === null) notFound();

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Edit {project.title}</h1>
      <ProjectForm
        id={project.id}
        initial={{
          title: project.title,
          clientId: project.clientId ?? "",
          workStatus: project.workStatus,
          category: project.category,
          year: String(project.year),
          summary: project.summary,
        }}
        clients={clients}
        cancelHref={`/admin/projects/${project.id}`}
      />
    </div>
  );
}
