import Link from "next/link";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { contactCta, footer, primaryNav, privacyPublished } from "@/content/site";

import { Brand } from "./Brand";
import styles from "./SiteFooter.module.css";

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
          <Link href="/" className={styles.home} aria-label="LOOKDIT, home">
            <Brand height={40} />
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

          <p className={styles.legal}>
            © {year} LOOKDIT
            {privacyPublished() ? (
              <>
                {" · "}
                <Link href="/privacy" className={styles.link}>
                  Privacy
                </Link>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </footer>
  );
}
