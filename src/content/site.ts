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
  // The strip under the hero: confirmed facts only, never statistics.
  facts: [
    { label: "Services", value: "SEO, Digital Marketing, Web Apps" },
    { label: "Priority industries", value: "E-commerce, healthcare, home services, construction" },
    { label: "Based in", value: "Bangladesh" },
  ],
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
      contactHeading: "Tell us about your search goals.",
      focusAreas: [] as readonly string[],
    },
    {
      slug: "digital-marketing",
      name: "Digital Marketing",
      description: "Reach customers through focused digital channels.",
      contactHeading: "Tell us who you need to reach.",
      focusAreas: [] as readonly string[],
    },
    {
      slug: "web-apps",
      name: "Web Apps Development",
      description:
        "Build websites and web applications that support customer journeys and business operations.",
      contactHeading: "Tell us what you need built.",
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
    heading: "Client case studies are on the way.",
    body: "We're preparing a selection of recent work. Meanwhile, the concept projects below show how we approach a brief.",
  },
} as const;

export const footer = {
  cta: "Have something worth building?",
} as const;

/**
 * Company details, in one place. `null` means "not confirmed yet": pages show
 * nothing for it, or a visible "Pending confirmation" label where the text
 * needs it (the privacy policy). Replace a null with the confirmed value and
 * every page picks it up.
 */
export const company = {
  name: "LOOKDIT",
  /** Registered legal name. */
  legalName: null as string | null,
  /** Operating country, confirmed 2026-10-09. */
  country: "Bangladesh" as string | null,
  /** Address for privacy and data requests. */
  privacyEmail: null as string | null,
  founded: null as string | null,
  team: null as string | null,
};

/** About page. Company facts come from `company` and show only once confirmed. */
export const about = {
  label: "About LOOKDIT",
  heading: "Visibility, reach and the web systems behind them.",
  lead: hero.supporting,
  facts: {
    based: company.country,
    founded: company.founded,
    team: company.team,
  },
} as const;

/**
 * Privacy policy. Published as a DRAFT (noindex, out of the sitemap) until it
 * has been legally reviewed and the pending details are confirmed. The page
 * text describes what the code actually does; see the page for the sources.
 */
export const privacy = {
  status: "draft" as "draft" | "final",
  /** How long contact-form inquiries are kept. */
  retention: null as string | null,
  /** Date the current text was written. */
  lastUpdated: "9 October 2026",
};

export const PENDING = "Pending confirmation";
