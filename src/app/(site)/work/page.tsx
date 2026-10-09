import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { FeatureTile } from "@/components/work/FeatureTile";
import { WorkCard } from "@/components/work/WorkCard";
import { contactCta, workIndex } from "@/content/site";
import { conceptNote, selectedWork } from "@/content/work";
import { listPublishedProjects } from "@/db/queries/projects";

import styles from "./page.module.css";

// Published projects come from the database at request time, so this page reads
// live data rather than being prerendered at build (which would need DATABASE_URL).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Work",
  description: workIndex.intro,
  alternates: { canonical: "/work" },
  openGraph: { title: "Work — LOOKDIT", description: workIndex.intro, url: "/work", siteName: "LOOKDIT", type: "website" },
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

        <section className={styles.concepts} aria-labelledby="concepts-title">
          <div className={styles.conceptsHead}>
            <SectionLabel as="h2" id="concepts-title">
              Concept projects
            </SectionLabel>
            <p className={styles.conceptsNote}>{conceptNote}</p>
          </div>
          <div className={styles.conceptGrid}>
            {selectedWork.items.map((concept) => (
              <FeatureTile key={concept.slug} entry={{ kind: "concept", concept }} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
