import type { Metadata } from "next";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { requireUser } from "@/lib/auth/session";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Dashboard",
};

const areas = [
  { title: "Inquiries", body: "New requests from the contact form, ready to review and answer." },
  { title: "Clients", body: "The people and companies LOOKDIT works with." },
  { title: "Projects", body: "Work in progress and the case studies on the public site." },
] as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name.trim().split(/\s+/)[0];

  return (
    <div className={`container ${styles.page}`}>
      <SectionLabel>Dashboard</SectionLabel>
      <h1 className={styles.title}>Welcome back, {firstName}.</h1>
      <p className={styles.lede}>Your workspace for running LOOKDIT. Each area opens here as it’s set up.</p>

      <ul className={styles.areas} aria-label="Workspace areas">
        {areas.map((area) => (
          <li key={area.title} className={styles.area}>
            <h2 className={styles.areaTitle}>{area.title}</h2>
            <p className={styles.areaBody}>{area.body}</p>
            <p className={styles.areaStatus}>Not set up yet</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
