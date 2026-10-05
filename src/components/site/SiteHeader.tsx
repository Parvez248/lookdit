import Link from "next/link";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { contactCta, primaryNav } from "@/content/site";

import { Brand } from "./Brand";
import { MobileMenu } from "./MobileMenu";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.home} aria-label="LOOKDIT, home">
          <Brand />
        </Link>

        <nav aria-label="Primary" className={styles.nav}>
          <ul className={styles.links}>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href={contactCta.href} size="sm">
            {contactCta.label}
          </ButtonLink>
        </nav>

        <MobileMenu items={primaryNav} cta={contactCta} />
      </div>
    </header>
  );
}
