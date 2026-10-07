import type { Metadata } from "next";

import { ClientForm } from "@/components/admin/ClientForm";
import { requireUser } from "@/lib/auth/session";

import styles from "@/components/admin/AdminFormPage.module.css";

export const metadata: Metadata = {
  title: "Add client",
};

export default async function NewClientPage() {
  await requireUser();
  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Add client</h1>
      <p className={styles.lede}>Only the name is required. Everything else can be added later.</p>
      <ClientForm
        initial={{ name: "", company: "", email: "", phone: "", website: "", notes: "", status: "lead" }}
        cancelHref="/admin/clients"
      />
    </div>
  );
}
