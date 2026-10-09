import Link from "next/link";

import { services } from "@/content/site";

import styles from "./ServiceLinks.module.css";

type ServiceLinksProps = {
  /** Slugs to leave out, such as the page's own service. */
  exclude?: string;
};

/** The service pillars as a list of links to their pages. */
export function ServiceLinks({ exclude }: ServiceLinksProps) {
  const items = services.items.filter((service) => service.slug !== exclude);

  return (
    <ul className={styles.list}>
      {items.map((service) => (
        <li key={service.slug} className={styles.item}>
          <Link href={`/services/${service.slug}`} className={styles.link}>
            <span className={styles.name}>{service.name}</span>
            <span className={styles.description}>{service.description}</span>
            <svg className={styles.arrow} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  );
}
