// Static site content (the locked architecture keeps curated site copy in code).
// Hero and service copy: v1 approved positioning (2026-10-05), from the LOOKDIT positioning
// framework. It may be refined as stronger business evidence emerges.

export type NavItem = { label: string; href: string };

/** Section anchors on the home page; each section lands in its own slice. */
export const primaryNav: readonly NavItem[] = [
  { label: "Work", href: "/#work" },
  { label: "Services", href: "/#services" },
  { label: "Process", href: "/#process" },
  { label: "Studio", href: "/#studio" },
];

export const contactCta: NavItem = { label: "Start a project", href: "/#contact" };

export const hero = {
  eyebrow: "SEO · Digital Marketing · Web Apps",
  // The headline is split so the Focus Frame can wrap the final phrase.
  headlineLead: "Digital work that holds up to a",
  headlineFocus: "closer look.",
  supporting:
    "LOOKDIT helps businesses improve visibility, reach customers, and build the web systems they need through SEO, digital marketing, and web application development.",
  secondaryCta: { label: "See selected work", href: "/#work" },
  /** The three core service pillars, each a peer of the others. */
  coreServices: ["SEO", "Digital Marketing", "Web Apps Development"],
} as const;

export const footer = {
  cta: "Have something worth building?",
} as const;
