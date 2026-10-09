import { SectionLabel } from "@/components/ui/SectionLabel";
import { industries } from "@/content/site";

import styles from "./Industries.module.css";

/** A small line mark per sector, drawn on a 24-unit grid in the order of `industries.items`. */
const MARKS = [
  // E-commerce: a bag
  "M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2",
  // Healthcare & clinics: a cross in a square
  "M4 4h16v16H4V4Zm8 4v8m-4-4h8",
  // Home services: a house with a door
  "M3 11 12 4l9 7M5 9.5V20h14V9.5M10 20v-5h4v5",
  // Construction: a crane over a block
  "M4 20h16M7 20V4h10M7 7h12M17 7v4M14 20v-6h6v6",
];

/**
 * Priority industries: four cells in a row on wide screens, two on tablets,
 * stacked on phones. The order is the priority, so it's an ordered list; the
 * label is the section's heading because no separate title has been approved.
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
              <span className={styles.top} aria-hidden="true">
                <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
                <svg className={styles.mark} viewBox="0 0 24 24" focusable="false">
                  <path d={MARKS[index]} />
                </svg>
              </span>
              <span className={styles.name}>{industry}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
