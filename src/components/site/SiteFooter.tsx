import Link from "next/link";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { company, contactCta, footer, primaryNav } from "@/content/site";

import { Brand } from "./Brand";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        {/* Hidden by CSS on pages whose own contact form sits just above it. */}
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
            {company.country ? ` · ${company.country}` : null}
            {" · "}
            <Link href="/privacy" className={styles.legalLink}>
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
