// Selected Work content (static, curated).
// Rule: Selected Work may contain real client work and clearly identified LOOKDIT concept work.
// Concept work must never be presented in a way that implies a real client, commercial
// engagement, or measured result. Concept projects therefore live here, never in the
// `projects` table, and their type has no client, year, metrics or live-URL fields at all.

import type { services } from "./site";

type ServiceName = (typeof services.items)[number]["name"];

/** A stage position on the journey: 1-based, inclusive. */
type StagePosition = 1 | 2 | 3 | 4 | 5;

/**
 * A temporary experience/capability map: where each core service is emphasised across a
 * customer journey. It describes the concept's design intent, not measured data, and is
 * replaced by the concept's real screens once they exist.
 */
export type CapabilityMap = {
  /** Frames the spans as emphasis in this concept, not strict service boundaries. */
  label: string;
  caption: string;
  stages: readonly [string, string, string, string, string];
  spans: readonly { capability: ServiceName; from: StagePosition; to: StagePosition }[];
};

/** A screen the concept will show. Rendered as a clearly labelled placeholder until a real demo capture exists. */
export type ConceptScreen = { title: string; caption: string };

export type ConceptProject = {
  kind: "concept";
  slug: string;
  title: string;
  /** The service-specimen drawing used as the concept's cover and hero. */
  visual: "concept-ecommerce" | "concept-healthcare" | "concept-dashboard";
  classification: string;
  description: string;
  overview: string;
  problem: string;
  solution: string;
  features: readonly string[];
  /** Illustrative: what LOOKDIT would build it with. Nothing here has been deployed. */
  stack: readonly string[];
  gallery: readonly ConceptScreen[];
  map: CapabilityMap;
};

/** Real client work joins this union when it exists (sourced from the database). */
export type WorkItem = ConceptProject;

/** Shown with every concept project. Rendered from `kind`, so it can't be left out. */
export const conceptDisclosure = "LOOKDIT Concept Project — Demonstration Only.";

/** Explains the label wherever a concept is shown in full. */
export const conceptNote =
  "Concept projects show how LOOKDIT would approach a brief. They are not client work: there is no client, no live deployment and no measured result.";

export const selectedWork = {
  label: "Selected work",
  items: [
    {
      kind: "concept",
      slug: "ecommerce-customer-experience",
      title: "E-commerce Website & Customer Experience",
      visual: "concept-ecommerce",
      classification: "Concept project · E-commerce",
      description: "A storefront designed around discovery, a short path to checkout and the operations behind it.",
      overview:
        "A concept for an independent retailer selling online: a fast storefront that customers can find through search, browse comfortably on a phone and buy from without friction, with the order and stock tools the team needs behind it.",
      problem:
        "Small online shops often run on a template that is slow on mobile, hard to find in search and disconnected from how orders are actually handled. Customers drop off between the product page and payment, and staff re-key orders by hand.",
      solution:
        "A storefront built for search from the start, with clear category and product pages, a checkout that asks only for what it needs, and an admin that keeps products, stock and orders in one place. Marketing campaigns land on pages made for them rather than the home page.",
      features: [
        "Search-friendly category and product pages",
        "Filters and sorting that work well on a phone",
        "Short, guest-friendly checkout",
        "Order and stock management in one admin",
        "Campaign landing pages for marketing",
        "Accessible, responsive layouts throughout",
      ],
      stack: ["Next.js", "TypeScript", "PostgreSQL", "Payment provider integration", "Image CDN"],
      gallery: [
        { title: "Product page", caption: "Gallery, options and a clear add-to-cart path on mobile." },
        { title: "Checkout", caption: "A single-page checkout with only the fields the order needs." },
      ],
      map: {
        label: "Service emphasis across the concept",
        caption: "Concept scope: where each core service is emphasised across the customer journey.",
        stages: ["Discovery", "Shopping", "Conversion", "Customer experience", "Business operations"],
        spans: [
          { capability: "SEO", from: 1, to: 2 },
          { capability: "Digital Marketing", from: 1, to: 3 },
          { capability: "Web Apps Development", from: 2, to: 5 },
        ],
      },
    },
    {
      kind: "concept",
      slug: "healthcare-appointment-booking",
      title: "Healthcare Appointment & Booking Platform",
      visual: "concept-healthcare",
      classification: "Concept project · Healthcare & clinics",
      description: "Online booking for a multi-practitioner clinic, from finding the right doctor to a confirmed slot.",
      overview:
        "A concept for a clinic with several practitioners: patients find the clinic and the right specialist, see real availability and book a slot themselves, while reception manages the schedule from one calendar.",
      problem:
        "Many clinics still book by phone. Patients wait on hold or call during opening hours only, reception juggles paper or spreadsheets, and missed appointments leave gaps nobody can refill in time.",
      solution:
        "A booking flow that shows each practitioner's open slots, takes the details the clinic needs and confirms by email or SMS. Reception gets a shared calendar for the week with reschedule and cancel in a click, and local search pages help patients find the clinic in the first place.",
      features: [
        "Practitioner and service selection",
        "Live availability and self-service booking",
        "Booking confirmations and reminders",
        "Reception calendar with reschedule and cancel",
        "Local search pages for each service",
        "Accessible forms with clear error messages",
      ],
      stack: ["Next.js", "TypeScript", "PostgreSQL", "Email and SMS provider", "Calendar sync"],
      gallery: [
        { title: "Choose a slot", caption: "A practitioner's week, with open times you can tap to book." },
        { title: "Reception calendar", caption: "All practitioners' bookings for the day in one view." },
      ],
      map: {
        label: "Service emphasis across the concept",
        caption: "Concept scope: where each core service is emphasised across the patient journey.",
        stages: ["Finding the clinic", "Choosing care", "Booking", "Visit & reminders", "Clinic operations"],
        spans: [
          { capability: "SEO", from: 1, to: 2 },
          { capability: "Digital Marketing", from: 1, to: 2 },
          { capability: "Web Apps Development", from: 2, to: 5 },
        ],
      },
    },
    {
      kind: "concept",
      slug: "business-management-dashboard",
      title: "Business Management Dashboard",
      visual: "concept-dashboard",
      classification: "Concept project · Operations",
      description: "One dashboard for jobs, customers and invoices, built for a growing service business.",
      overview:
        "A concept for a home-services or construction business that has outgrown spreadsheets: one place to see today's jobs, who is assigned, what has been quoted and invoiced, and what needs attention next.",
      problem:
        "As a service business grows, work is tracked across spreadsheets, chat groups and paper. Owners can't see the week at a glance, jobs slip between people, and invoices go out late because the details live in several places.",
      solution:
        "A web dashboard built around the day's work: a job board with status and assignee, customer records with their history, quotes that turn into invoices, and an overview that shows what needs action. Roles keep staff to the parts they need.",
      features: [
        "Overview of today's jobs and open tasks",
        "Job board with status and assignee",
        "Customer records with full history",
        "Quotes that convert to invoices",
        "Role-based access for staff",
        "Works on a phone for teams on site",
      ],
      stack: ["Next.js", "TypeScript", "PostgreSQL", "Role-based authentication", "PDF generation"],
      gallery: [
        { title: "Job board", caption: "Jobs grouped by status, each with its assignee and due date." },
        { title: "Customer record", caption: "Contact details, past jobs and invoices for one customer." },
      ],
      map: {
        label: "Service emphasis across the concept",
        caption: "Concept scope: where each core service is emphasised across the business workflow.",
        stages: ["Enquiry", "Quote", "Scheduling", "Job delivery", "Invoicing"],
        spans: [
          { capability: "SEO", from: 1, to: 1 },
          { capability: "Digital Marketing", from: 1, to: 2 },
          { capability: "Web Apps Development", from: 1, to: 5 },
        ],
      },
    },
  ],
} as const satisfies { label: string; items: readonly WorkItem[] };

export function findConcept(slug: string): ConceptProject | null {
  return selectedWork.items.find((item) => item.slug === slug) ?? null;
}
