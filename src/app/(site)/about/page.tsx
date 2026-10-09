import type { Metadata } from "next";

import { Industries } from "@/components/home/Industries";
import { Services } from "@/components/home/Services";
import { PageIntro } from "@/components/site/PageIntro";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { about, contactCta } from "@/content/site";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description: about.lead,
  alternates: { canonical: "/about" },
  openGraph: { title: "About — LOOKDIT", description: about.lead, url: "/about", siteName: "LOOKDIT", type: "website" },
};

const FACT_LABELS = { based: "Based in", founded: "Founded", team: "Team" } as const;

export default function AboutPage() {
  // Company facts show only once confirmed (see `about.facts`).
  const facts = (Object.keys(FACT_LABELS) as (keyof typeof FACT_LABELS)[]).flatMap((key) => {
    const value = about.facts[key];
    return value ? [{ key, label: FACT_LABELS[key], value }] : [];
  });

  return (
    <article className={styles.page} aria-labelledby="about-title">
      <section className={styles.top}>
        <div className={`container ${styles.inner}`}>
          <PageIntro
            label={about.label}
            title={about.heading}
            titleId="about-title"
            lead={about.lead}
            actions={
              <>
                <ButtonLink href={contactCta.href}>{contactCta.label}</ButtonLink>
                <ButtonLink href="/work" variant="quiet">
                  See our work
                </ButtonLink>
              </>
            }
          />

          {facts.length > 0 ? (
            <dl className={styles.facts}>
              {facts.map((fact) => (
                <div key={fact.key} className={styles.fact}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      <Services />
      <Industries />
    </article>
  );
}
