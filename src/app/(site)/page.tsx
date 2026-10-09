import type { Metadata } from "next";

import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { Industries } from "@/components/home/Industries";
import { SelectedWork } from "@/components/home/SelectedWork";
import { Services } from "@/components/home/Services";
import { hero, services } from "@/content/site";
import { jsonLd } from "@/lib/json-ld";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Organization structured data for search engines. Only facts the site already
 * states (name, URL, logo, description, services); nothing about locations,
 * ratings or clients until those are real and confirmed.
 */
function organizationJsonLd(): string {
  const origin = siteUrl();
  return jsonLd({
    "@type": "Organization",
    name: "LOOKDIT",
    url: origin.href,
    logo: new URL("/brand/lookdit-logo.png", origin).href,
    description: hero.supporting,
    knowsAbout: services.items.map((item) => item.name),
  });
}

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organizationJsonLd() }} />
      <Hero />
      <Services />
      <Industries />
      <SelectedWork />
      <Contact />
    </>
  );
}
