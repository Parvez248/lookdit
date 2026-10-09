import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Industries } from "@/components/home/Industries";
import { ServiceLinks } from "@/components/services/ServiceLinks";
import { PageIntro } from "@/components/site/PageIntro";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { contactCta, services } from "@/content/site";
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
  const origin = siteUrl();

  // Only what the page states: no area served, prices or ratings.
  const structuredData = jsonLd({
    "@type": "Service",
    name: service.name,
    serviceType: service.name,
    description: service.description,
    url: new URL(`/services/${service.slug}`, origin).href,
    provider: { "@type": "Organization", name: "LOOKDIT", url: origin.href },
  });

  return (
    <article className={styles.page} aria-labelledby="service-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />

      <section className={styles.top}>
        <div className={`container ${styles.inner}`}>
          <Link href="/#services" className={styles.back}>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.backIcon}>
              <path d="M13 8H3.5M7.5 4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            All services
          </Link>

          <PageIntro
            label={`Service ${String(index).padStart(2, "0")}`}
            title={service.name}
            titleId="service-title"
            lead={service.description}
            actions={
              <>
                <ButtonLink href={contactCta.href}>{contactCta.label}</ButtonLink>
                <ButtonLink href="/work" variant="quiet">
                  See our work
                </ButtonLink>
              </>
            }
          />
        </div>
      </section>

      {service.focusAreas.length > 0 ? (
        <section className={styles.block} aria-labelledby="focus-title">
          <div className={`container ${styles.inner}`}>
            <SectionLabel as="h2" id="focus-title">
              What it covers
            </SectionLabel>
            <ul className={styles.focus}>
              {service.focusAreas.map((area) => (
                <li key={area} className={styles.focusItem}>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <Industries />

      <section className={styles.block} aria-labelledby="other-services-title">
        <div className={`container ${styles.inner}`}>
          <SectionLabel as="h2" id="other-services-title">
            Other services
          </SectionLabel>
          <ServiceLinks exclude={service.slug} />
        </div>
      </section>
    </article>
  );
}
