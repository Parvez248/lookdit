import Link from "next/link";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { contactCta, footer, primaryNav } from "@/content/site";

import styles from "./SiteFooter.module.css";
import { Wordmark } from "./Wordmark";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.cta}>
          <p className={styles.ctaLine}>{footer.cta}</p>
          <ButtonLink href={contactCta.href}>{contactCta.label}</ButtonLink>
        </div>

        <div className={styles.meta}>
          <Link href="/" className={styles.home} aria-label="Lookdit, home">
            <Wordmark />
          </Link>

          <nav aria-label="Footer">
            <ul className={styles.links}>
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className={styles.legal}>© {year} Lookdit</p>
        </div>
      </div>
    </footer>
  );
}
