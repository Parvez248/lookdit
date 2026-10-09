import Link from "next/link";

import { Specimen } from "@/components/specimens/Specimen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { services } from "@/content/site";

import styles from "./Services.module.css";

/**
 * Core services as an editorial ledger with a specimen beside each entry. Each
 * row links to the service's page: the link sits on the name, and its ::after
 * stretches over the whole row, so the row is one target without nesting the
 * description inside the link.
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
            <li key={service.slug} className={styles.row}>
              <div className={styles.text}>
                <span className={styles.index} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.name}>
                  <Link href={`/services/${service.slug}`} className={styles.link}>
                    {service.name}
                  </Link>
                </h3>
                <p className={styles.description}>{service.description}</p>
                <span className={styles.more} aria-hidden="true">
                  Explore {service.name}
                  <svg className={styles.arrow} viewBox="0 0 16 16" focusable="false">
                    <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
              </div>
              <Specimen kind={service.slug} className={styles.figure} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
