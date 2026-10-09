import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CapabilityMap } from "@/components/home/CapabilityMap";
import { Contact } from "@/components/home/Contact";
import { PageIntro } from "@/components/site/PageIntro";
import { Specimen } from "@/components/specimens/Specimen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ConceptBadge } from "@/components/work/ConceptBadge";
import { ScreenPlaceholder } from "@/components/work/ScreenPlaceholder";
import { conceptNote, findConcept, selectedWork } from "@/content/work";

import styles from "./page.module.css";

// Concepts are static content (never in the projects table), so every page is
// prerendered and any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return selectedWork.items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/concepts/[slug]">): Promise<Metadata> {
  const concept = findConcept((await params).slug);
  if (concept === null) return {};
  const canonical = `/work/concepts/${concept.slug}`;
  const title = `${concept.title} (concept)`;
  return {
    title,
    description: concept.description,
    alternates: { canonical },
    openGraph: { title: `${title} — LOOKDIT`, description: concept.description, url: canonical, siteName: "LOOKDIT", type: "article" },
  };
}

export default async function ConceptPage({ params }: PageProps<"/work/concepts/[slug]">) {
  const concept = findConcept((await params).slug);
  if (concept === null) notFound();

  return (
    <article aria-labelledby="concept-title">
      <div className={`container ${styles.inner}`}>
        <Link href="/work" className={styles.back}>
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.backIcon}>
            <path d="M13 8H3.5M7.5 4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          All work
        </Link>

        <div className={styles.head}>
          <ConceptBadge />
          <PageIntro label={concept.classification} title={concept.title} titleId="concept-title" lead={concept.description} />
          <p className={styles.note}>{conceptNote}</p>
        </div>

        <Specimen kind={concept.visual} animate />

        <div className={styles.layout}>
          <div className={styles.body}>
            <section aria-labelledby="overview">
              <h2 id="overview">Overview</h2>
              <p>{concept.overview}</p>
            </section>
            <section aria-labelledby="problem">
              <h2 id="problem">The problem</h2>
              <p>{concept.problem}</p>
            </section>
            <section aria-labelledby="solution">
              <h2 id="solution">Proposed solution</h2>
              <p>{concept.solution}</p>
            </section>
            <section aria-labelledby="features">
              <h2 id="features">Main features</h2>
              <ul className={styles.features}>
                {concept.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </section>
          </div>

          <aside className={styles.side} aria-label="Concept details">
            <dl className={styles.facts}>
              <div>
                <dt>Type</dt>
                <dd>Concept · demonstration only</dd>
              </div>
              <div>
                <dt>Client</dt>
                <dd>None (LOOKDIT concept)</dd>
              </div>
              <div>
                <dt>Illustrative stack</dt>
                <dd>
                  <ul className={styles.stack}>
                    {concept.stack.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className={styles.stackNote}>How we would build it. Not a deployed product.</p>
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        <section className={styles.block} aria-labelledby="emphasis-title">
          <SectionLabel as="h2" id="emphasis-title">
            Where each service comes in
          </SectionLabel>
          <CapabilityMap map={concept.map} />
        </section>

        <section className={styles.block} aria-labelledby="screens-title">
          <SectionLabel as="h2" id="screens-title">
            Key screens
          </SectionLabel>
          <div className={styles.gallery}>
            {concept.gallery.map((screen) => (
              <ScreenPlaceholder key={screen.title} title={screen.title} caption={screen.caption} />
            ))}
          </div>
        </section>
      </div>

      <Contact heading="Have a project like this in mind?" />
    </article>
  );
}
