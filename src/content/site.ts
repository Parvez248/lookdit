// Static site content (the locked architecture keeps curated site copy in code).
// Hero and service copy: v1 approved positioning (2026-10-05), from the LOOKDIT positioning
// framework. It may be refined as stronger business evidence emerges.

export type NavItem = { label: string; href: string };

/**
 * Section anchors on the home page. Only sections that exist are listed:
 * Work returns when Selected Work is implemented, and Studio only when a real
 * Studio/About section exists.
 */
export const primaryNav: readonly NavItem[] = [
  { label: "Services", href: "/#services" },
  { label: "Industries", href: "/#industries" },
];

export const contactCta: NavItem = { label: "Start a project", href: "/#contact" };

export const hero = {
  eyebrow: "SEO · Digital Marketing · Web Apps",
  // The headline is split so the Focus Frame can wrap the final phrase.
  headlineLead: "Digital work that holds up to a",
  headlineFocus: "closer look.",
  supporting:
    "LOOKDIT helps businesses improve visibility, reach customers, and build the web systems they need through SEO, digital marketing, and web application development.",
  // Points at Services until Selected Work exists.
  secondaryCta: { label: "Explore services", href: "/#services" },
} as const;

/**
 * The three core service pillars, peers of one another. Descriptions are v1
 * working copy. Sub-services are unconfirmed, so none are listed.
 */
export const services = {
  label: "Core services",
  heading: "Built around visibility, reach and useful web systems.",
  items: [
    {
      name: "SEO",
      description: "Improve search visibility so the right customers can find your business.",
    },
    {
      name: "Digital Marketing",
      description: "Reach customers through focused digital channels.",
    },
    {
      name: "Web Apps Development",
      description:
        "Build websites and web applications that support customer journeys and business operations.",
    },
  ],
} as const;

/** Priority sectors, in priority order. Priority areas, not exclusive markets. */
export const industries = {
  label: "Priority industries",
  intro: "LOOKDIT serves multiple industries, with deeper focus on four priority sectors.",
  items: [
    "E-commerce",
    "Healthcare & Clinics",
    "Home Services",
    "Residential & Commercial Construction Services",
  ],
} as const;

export const footer = {
  cta: "Have something worth building?",
} as const;
