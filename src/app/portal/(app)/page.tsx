import type { Metadata } from "next";

import { ProjectCard } from "@/components/portal/ProjectCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { listPortalProjects, type PortalProjectSummary } from "@/db/queries/portal";
import { requireClient } from "@/lib/portal/session";
import { todayUtc } from "@/lib/workspace/progress";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Your projects",
};

export default async function PortalHomePage() {
  const client = await requireClient();
  // The client id comes from the verified session, never from the request.
  const projects = await listPortalProjects(client.clientId);
  const today = todayUtc();
  const current = projects.filter((project) => project.workStatus !== "completed");
  const completed = projects.filter((project) => project.workStatus === "completed");

  return (
    <div className={`container ${styles.page}`}>
      <SectionLabel>{client.company ?? client.clientName}</SectionLabel>
      <h1 className={styles.title}>Your projects</h1>
      <p className={styles.lede}>
        Where each project stands: progress, the next milestone and what’s due. The LOOKDIT team
        keeps this up to date as work moves.
      </p>

      {projects.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No projects to show yet.</p>
          <p className={styles.emptyBody}>When LOOKDIT starts work with you, your project appears here.</p>
        </div>
      ) : (
        <>
          <ProjectGroup id="current" title="Current" projects={current} today={today} />
          <ProjectGroup id="completed" title="Completed" projects={completed} today={today} />
        </>
      )}
    </div>
  );
}

type ProjectGroupProps = {
  id: string;
  title: string;
  projects: PortalProjectSummary[];
  today: string;
};

function ProjectGroup({ id, title, projects, today }: ProjectGroupProps) {
  if (projects.length === 0) return null;
  const headingId = `${id}-title`;

  return (
    <section className={styles.group} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.groupTitle}>
        {title}
        <span className={styles.groupCount}>
          <span className="visually-hidden">, </span>
          {projects.length}
        </span>
      </h2>
      <ul className={styles.cards}>
        {projects.map((project) => (
          <li key={project.id}>
            <ProjectCard project={project} today={today} />
          </li>
        ))}
      </ul>
    </section>
  );
}
