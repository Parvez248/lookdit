import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClientForm } from "@/components/admin/ClientForm";
import { getClient } from "@/db/queries/clients";
import { requireUser } from "@/lib/auth/session";
import { isClientId } from "@/lib/clients/status";

import styles from "@/components/admin/AdminFormPage.module.css";

export const metadata: Metadata = {
  title: "Edit client",
};

export default async function EditClientPage({ params }: PageProps<"/admin/clients/[id]/edit">) {
  await requireUser();
  const { id } = await params;
  if (!isClientId(id)) notFound();
  const client = await getClient(id);
  if (client === null) notFound();

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Edit {client.name}</h1>
      <ClientForm
        id={client.id}
        initial={{
          name: client.name,
          company: client.company ?? "",
          email: client.email ?? "",
          phone: client.phone ?? "",
          website: client.website ?? "",
          notes: client.notes ?? "",
          status: client.status,
        }}
        cancelHref={`/admin/clients/${client.id}`}
      />
    </div>
  );
}
