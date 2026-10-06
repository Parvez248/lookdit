import { SectionLabel } from "@/components/ui/SectionLabel";
import { industries } from "@/content/site";

import styles from "./Industries.module.css";

/**
 * Priority industries as a 2 × 2 matrix (stacked rows on small screens). The
 * order is the priority, so it's an ordered list; the label is the section's
 * heading because no separate title has been approved.
 */
export function Industries() {
  return (
    <section id="industries" className={styles.section} aria-labelledby="industries-title">
      <div className={`container grid ${styles.inner}`}>
        <div className={styles.intro}>
          <SectionLabel as="h2" id="industries-title">
            {industries.label}
          </SectionLabel>
          <p className={styles.lead}>{industries.intro}</p>
        </div>

        <ol className={styles.matrix}>
          {industries.items.map((industry, index) => (
            <li key={industry} className={styles.cell}>
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.name}>{industry}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
