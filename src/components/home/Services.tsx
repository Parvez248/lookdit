import { SectionLabel } from "@/components/ui/SectionLabel";
import { services } from "@/content/site";

import styles from "./Services.module.css";

/**
 * Core services as an editorial ledger. The rows are not links: service pages
 * don't exist yet, so nothing here suggests it can be clicked.
 */
export function Services() {
  return (
    <section id="services" className={styles.section} aria-labelledby="services-title">
      <div className={`container grid ${styles.inner}`}>
        <div className={styles.intro}>
          <SectionLabel>{services.label}</SectionLabel>
          <h2 id="services-title" className={styles.heading}>
            {services.heading}
          </h2>
        </div>

        <ol className={styles.list}>
          {services.items.map((service, index) => (
            <li key={service.name} className={styles.row}>
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className={styles.name}>{service.name}</h3>
              <p className={styles.description}>{service.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
