// Static site content (the locked architecture keeps curated site copy in code).
// Hero wording is an approved DRAFT and expected to change.

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
  eyebrow: "Product design & engineering studio",
  // The headline is split so the Focus Frame can wrap the final phrase.
  headlineLead: "We design and engineer software that holds up to a",
  headlineFocus: "closer look.",
  supporting:
    "Lookdit is a product studio for companies whose software has to be exact: product design, web applications and the engineering underneath.",
  secondaryCta: { label: "See selected work", href: "/#work" },
  disciplines: ["Product design", "Web applications", "Engineering"],
} as const;

export const footer = {
  cta: "Have something worth building?",
} as const;
