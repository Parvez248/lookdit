import { SectionLabel } from "@/components/ui/SectionLabel";
import { conceptDisclosure, selectedWork } from "@/content/work";

import { CapabilityMap } from "./CapabilityMap";
import styles from "./SelectedWork.module.css";

/**
 * Selected work as editorial project plates. Today there is one LOOKDIT concept project;
 * its classification and disclosure sit beside the title so it can never read as client
 * work. No link yet: there is no project page to open.
 */
export function SelectedWork() {
  return (
    <section id="work" className={styles.section} aria-labelledby="work-title">
      <div className={`container grid ${styles.inner}`}>
        <SectionLabel as="h2" id="work-title" className={styles.label}>
          {selectedWork.label}
        </SectionLabel>

        {selectedWork.items.map((item, index) => (
          <article key={item.slug} className={styles.project} aria-labelledby={`work-${item.slug}`}>
            <p className={styles.readout} aria-hidden="true">
              {String(index + 1).padStart(2, "0")} / Concept
            </p>
            <h3 id={`work-${item.slug}`} className={styles.title}>
              {item.title}
            </h3>
            <div className={styles.meta}>
              <p className={styles.classification}>{item.classification}</p>
              <p className={styles.description}>{item.description}</p>
              {item.kind === "concept" && <p className={styles.disclosure}>{conceptDisclosure}</p>}
            </div>
            <div className={styles.visual}>
              <CapabilityMap map={item.map} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
