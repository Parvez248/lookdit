import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Contact } from "@/components/home/Contact";
import { PageIntro } from "@/components/site/PageIntro";
import { Specimen } from "@/components/specimens/Specimen";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { company, contactCta, industries, services } from "@/content/site";
import { jsonLd } from "@/lib/json-ld";
import { siteUrl } from "@/lib/site-url";

import styles from "./page.module.css";

// The three pillars are static content, so every page is prerendered and any
// other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return services.items.map((service) => ({ slug: service.slug }));
}

function findService(slug: string) {
  return services.items.find((service) => service.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const service = findService((await params).slug);
  if (service === null) return {};
  const canonical = `/services/${service.slug}`;

  return {
    title: service.name,
    description: service.description,
    alternates: { canonical },
    openGraph: {
      title: `${service.name} — LOOKDIT`,
      description: service.description,
      url: canonical,
      siteName: "LOOKDIT",
      type: "website",
    },
  };
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = findService(slug);
  if (service === null) notFound();
  const index = services.items.indexOf(service) + 1;
  const others = services.items.filter((item) => item.slug !== service.slug);
  const origin = siteUrl();

  // Only what the page states: no prices, ratings or results.
  const structuredData = jsonLd({
    "@type": "Service",
    name: service.name,
    serviceType: service.name,
    description: service.description,
    url: new URL(`/services/${service.slug}`, origin).href,
    provider: { "@type": "Organization", name: "LOOKDIT", url: origin.href },
  });

  return (
    <article aria-labelledby="service-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />

      <section className={styles.top}>
        <div className="container">
          <Link href="/#services" className={styles.back}>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.backIcon}>
              <path d="M13 8H3.5M7.5 4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            All services
          </Link>

          <div className={`grid ${styles.split}`}>
            <div className={styles.intro}>
              <PageIntro
                label={`Service ${String(index).padStart(2, "0")}`}
                title={service.name}
                titleId="service-title"
                lead={service.description}
                actions={
                  <>
                    <ButtonLink href="#contact">{contactCta.label}</ButtonLink>
                    <ButtonLink href="/work" variant="quiet">
                      See our work
                    </ButtonLink>
                  </>
                }
              />
            </div>
            <Specimen kind={service.slug} animate className={styles.figure} />
          </div>
        </div>
      </section>

      {/* The brief: a definition list, one hairline row per fact. */}
      <section className={styles.brief} aria-label={`${service.name} at a glance`}>
        <div className="container">
          <dl className={styles.rows}>
            {service.focusAreas.length > 0 ? (
              <div className={styles.row}>
                <dt>What it covers</dt>
                <dd>
                  <ul className={styles.tags}>
                    {service.focusAreas.map((area) => (
                      <li key={area}>{area}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
            <div className={styles.row}>
              <dt>Priority industries</dt>
              <dd>
                <ul className={styles.tags}>
                  {industries.items.map((industry) => (
                    <li key={industry}>{industry}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div className={styles.row}>
              <dt>Works with</dt>
              <dd>
                <ul className={styles.links}>
                  {others.map((other) => (
                    <li key={other.slug}>
                      <Link href={`/services/${other.slug}`} className={styles.link}>
                        {other.name}
                        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.linkIcon}>
                          <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            {company.country ? (
              <div className={styles.row}>
                <dt>Based in</dt>
                <dd>{company.country}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      <Contact heading={service.contactHeading} />
    </article>
  );
}
