import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { WorkCard } from "@/components/work/WorkCard";
import { contactCta, workIndex } from "@/content/site";
import { listPublishedProjects } from "@/db/queries/projects";

import styles from "./page.module.css";

// Published projects come from the database at request time, so this page reads
// live data rather than being prerendered at build (which would need DATABASE_URL).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Work",
  description: workIndex.intro,
  alternates: { canonical: "/work" },
};

export default async function WorkPage() {
  const projects = await listPublishedProjects();

  return (
    <section className={styles.section} aria-labelledby="work-title">
      <div className={`container ${styles.inner}`}>
        <header className={styles.intro}>
          <SectionLabel>{workIndex.label}</SectionLabel>
          <h1 id="work-title" className={styles.heading}>
            {workIndex.heading}
          </h1>
          <p className={styles.lead}>{workIndex.intro}</p>
        </header>

        {projects.length > 0 ? (
          <ul className={styles.list}>
            {projects.map((project) => (
              <WorkCard key={project.id} project={project} />
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p className={styles.emptyHeading}>{workIndex.empty.heading}</p>
            <p className={styles.emptyBody}>{workIndex.empty.body}</p>
            <ButtonLink href={contactCta.href}>{contactCta.label}</ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}
