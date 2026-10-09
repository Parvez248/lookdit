import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { FeatureTile } from "@/components/work/FeatureTile";
import { selectedWork } from "@/content/work";
import { featuredWork } from "@/lib/work/featured";

import styles from "./SelectedWork.module.css";

/**
 * Selected Work: published client case studies first, topped up with LOOKDIT
 * concepts (each carrying the concept badge). The first entry leads at full
 * width; the rest sit side by side. Every tile links to its case study.
 */
export async function SelectedWork() {
  const entries = await featuredWork(3);
  const [lead, ...rest] = entries;

  return (
    <section id="work" className={styles.section} aria-labelledby="work-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.head}>
          <SectionLabel as="h2" id="work-title">
            {selectedWork.label}
          </SectionLabel>
          <ButtonLink href="/work" variant="quiet" size="sm">
            All work
          </ButtonLink>
        </div>

        {lead ? (
          <div className={styles.lead}>
            <FeatureTile entry={lead} size="lead" />
          </div>
        ) : null}

        {rest.length > 0 ? (
          <div className={styles.rest}>
            {rest.map((entry) => (
              <FeatureTile key={entry.kind === "client" ? entry.project.id : entry.concept.slug} entry={entry} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
