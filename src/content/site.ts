// Static site content (the locked architecture keeps curated site copy in code).
// Hero and service copy: v1 approved positioning (2026-10-05), from the LOOKDIT positioning
// framework. It may be refined as stronger business evidence emerges.

export type NavItem = { label: string; href: string };

/**
 * Primary navigation: home sections in page order, then pages.
 */
export const primaryNav: readonly NavItem[] = [
  { label: "Services", href: "/#services" },
  { label: "Industries", href: "/#industries" },
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
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
 * working copy. Each has a page at /services/<slug>. `focusAreas` stays empty
 * until sub-services are confirmed; the page shows that section only when it
 * has entries.
 */
export const services = {
  label: "Core services",
  heading: "Built around visibility, reach and useful web systems.",
  items: [
    {
      slug: "seo",
      name: "SEO",
      description: "Improve search visibility so the right customers can find your business.",
      focusAreas: [] as readonly string[],
    },
    {
      slug: "digital-marketing",
      name: "Digital Marketing",
      description: "Reach customers through focused digital channels.",
      focusAreas: [] as readonly string[],
    },
    {
      slug: "web-apps",
      name: "Web Apps Development",
      description:
        "Build websites and web applications that support customer journeys and business operations.",
      focusAreas: [] as readonly string[],
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

/**
 * Contact section copy. The form posts to the `submitInquiry` Server Action;
 * field labels mirror its four public fields (name, email, company, message).
 */
export const contact = {
  label: "Start a project",
  heading: "Tell us what you're building.",
  supporting:
    "Share a little about your business and what you need. We'll read it properly and reply by email.",
  fields: {
    name: { label: "Your name", placeholder: "Jane Doe" },
    email: { label: "Email", placeholder: "jane@company.com" },
    company: { label: "Company", optional: "optional", placeholder: "Company name" },
    message: { label: "What can we help with?", placeholder: "A few lines about your project, goals or timeline." },
  },
  submit: { idle: "Send message", pending: "Sending…" },
  success: {
    heading: "Message sent.",
    body: "Thanks — we've got your message and will get back to you by email soon.",
  },
} as const;

/**
 * Public portfolio (/work) copy. The projects themselves come from the database
 * (published only); this is only the page framing and the empty state.
 */
export const workIndex = {
  label: "Selected work",
  heading: "Work built to hold up to a closer look.",
  intro: "A selection of projects across SEO, digital marketing and web application development.",
  empty: {
    heading: "Case studies are on the way.",
    body: "We're preparing a selection of recent work. In the meantime, tell us what you're building.",
  },
} as const;

export const footer = {
  cta: "Have something worth building?",
} as const;

/**
 * About page. Only facts already approved elsewhere on the site. `facts` holds
 * company details (base, founding year, who runs it); each is null until
 * Khaled confirms it, and the page lists only the ones that are set.
 */
export const about = {
  label: "About LOOKDIT",
  heading: "Visibility, reach and the web systems behind them.",
  lead: hero.supporting,
  facts: {
    based: null as string | null,
    founded: null as string | null,
    team: null as string | null,
  },
} as const;

/**
 * Privacy policy. The sections describe what the code actually does (see
 * src/db/schema/inquiries.ts, src/lib/inquiries, src/lib/auth). The page stays
 * unpublished (404, no links) until every field in `owner` and `retention` is
 * confirmed: legal identity, contact and retention are commitments only the
 * business can make.
 */
export const privacy = {
  owner: {
    legalName: null as string | null,
    country: null as string | null,
    email: null as string | null,
  },
  retention: null as string | null,
  lastUpdated: null as string | null,
} as const;

/** True once the business facts the policy depends on are filled in. */
export function privacyPublished(): boolean {
  const { legalName, country, email } = privacy.owner;
  return Boolean(legalName && country && email && privacy.retention && privacy.lastUpdated);
}
