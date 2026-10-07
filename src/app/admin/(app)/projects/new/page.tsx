import type { Metadata } from "next";

import { ProjectForm } from "@/components/admin/ProjectForm";
import { listClientOptions } from "@/db/queries/admin-projects";
import { requireUser } from "@/lib/auth/session";
import { isClientId } from "@/lib/clients/status";

import styles from "@/components/admin/AdminFormPage.module.css";

export const metadata: Metadata = {
  title: "Add project",
};

export default async function NewProjectPage({ searchParams }: PageProps<"/admin/projects/new">) {
  await requireUser();
  const [{ client }, clients] = await Promise.all([searchParams, listClientOptions()]);
  // "Add a project for this client" on a client page preselects that client.
  const clientId = isClientId(client) && clients.some((option) => option.id === client) ? client : "";

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Add project</h1>
      <p className={styles.lede}>New projects stay private. Nothing here is published to the site.</p>
      <ProjectForm
        initial={{
          title: "",
          clientId,
          workStatus: "planned",
          category: "website",
          year: String(new Date().getUTCFullYear()),
          summary: "",
        }}
        clients={clients}
        cancelHref={clientId ? `/admin/clients/${clientId}` : "/admin/projects"}
      />
    </div>
  );
}
