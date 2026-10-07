# CLAUDE.md — Lookdit

Guidance for Claude Code (and any AI-assisted work) in this repository.

## Project

**Lookdit** — a production-grade company portfolio website.
Priorities, in order: **UI/UX quality → accessibility → performance → maintainable architecture.**

- Design inspiration: qubetix.co. **The design must be original — never a clone.** Use it for
  reference on feel and polish, not for copying layout, copy, or assets.
- Development is heavily AI-assisted, but the maintainer must understand every important
  architecture, logic, performance, and security decision. Explain, don't just produce.
- Avoid "vibe coding" and unnecessary complexity. Prefer simple, production-quality solutions.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript (strict mode)**
- **PostgreSQL** — only if/when backend data is actually justified. Not before.
- **GSAP + ScrollTrigger** — major/complex animation.
- **Lenis** — smooth scrolling, only when it materially improves the experience.
- **CSS Modules + CSS custom-property tokens** (decided 2026-09-26; no Tailwind). Tokens live in
  `src/app/globals.css`; component styles sit next to each component as `*.module.css`.
- **Three.js / React Three Fiber** — only if a specific visual concept genuinely requires 3D.

Nothing above is a mandate to install everything up front. Add each dependency when a real need
arises, and explain why (see rule 3).

## Engineering rules

**Architecture & process**
1. Never silently change architecture. Flag and discuss architectural shifts.
2. For non-trivial work, explain the plan before implementing.
3. Do not add a dependency without explaining why it's necessary and what it costs.
4. Prefer simple, production-quality solutions over overengineering.
15. Before large changes, identify affected files, risks, edge cases, and validation steps.
19. Challenge the proposed approach when there's a technically better alternative — with reasons.
20. Keep this file and other docs updated when architecture changes.

**TypeScript & React**
5. Never use `any` casually. Prefer precise types; if a type is genuinely unknown, use `unknown`
   and narrow, and justify any escape hatch.
6. Server Components by default. Use Client Components only when interactivity, browser APIs, or
   client state truly require it — and keep them small and pushed to the leaves.

**UX, accessibility, performance**
7. Accessibility and responsive behavior are first-class requirements, not afterthoughts.
8. All animations must respect `prefers-reduced-motion` (provide a reduced/none variant).
9. Performance is a product requirement — budget images, JS, fonts, and layout shifts; measure,
   don't guess.

**Data & algorithms**
10. Consider algorithmic complexity and data structures where they materially matter. Don't force
    DSA where it adds no value.
11. Do filtering, sorting, and pagination in the database — don't load unnecessary rows into memory.

**Security**
12. Security-sensitive code — auth, authorization, validation, DB mutations, payments, secrets —
    requires explicit reasoning and tests.
13. Never weaken security to make a feature work.

**Testing & verification**
14. Critical logic must have appropriate tests.
16. Run lint, typecheck, tests, and build (as appropriate) before declaring work complete.
17. Never claim something works unless it was actually verified. Report failures honestly.
18. Explain unfamiliar or important implementation decisions so the maintainer can learn from them.

## Current state

- **Backend:** PostgreSQL (Neon) via Drizzle. Schema and migrations in `src/db/schema` and
  `drizzle/`; typed reads in `src/db/queries`; inquiry writes in `src/db/mutations` behind the
  `submitInquiry` Server Action (`src/app/actions/inquiry.ts`) with validation and per-client
  rate limiting in `src/lib/inquiries`.
- **Two root layouts.** There is no `src/app/layout.tsx`. LOOKDIT's root layout is
  `src/app/(site)/layout.tsx` (with `(site)/page.tsx`); the e-commerce concept demo has its own
  root at `src/app/demo/ecommerce/layout.tsx`. Each root renders its own `<html>`, fonts and
  global CSS, so they never share styles; navigating between them is a full page load.
  - Known gap (deferred to launch hardening): with no top-level layout, unknown URLs get Next's
    bare default 404. A designed LOOKDIT 404 (and `global-not-found`, which is experimental) is
    planned then, not before.
- **Frontend (in progress):** dark-only "In Focus" design system. `src/app/(site)/layout.tsx`
  holds the shell (fonts, skip link, header, footer); `src/app/globals.css` holds the tokens
  (colour, type, space, motion), reset and the `.container` / `.grid` layout primitives.
  - `src/components/site`: header, native `<dialog>` mobile menu, footer, and
    `Brand` (the supplied logo in `public/brand/` with the "LOOKDIT" name beside it). The app
    icons `src/app/icon.png` / `apple-icon.png` are the same logo padded to square (temporary).
  - `src/components/ui`: shared primitives (`ButtonLink`, `FocusFrame`, `SectionLabel`).
  - `src/components/home`: home page sections: `Hero`, `Services`, `Industries`,
    `SelectedWork` (with `CapabilityMap`, the temporary visual for the concept project).
  - `src/content/site.ts`: static site copy and navigation. `src/content/work.ts`: static
    Selected Work content (concept projects only; real client work will come from the DB).
- **Content rule:** Selected Work may contain real client work and clearly identified LOOKDIT
  concept work. Concept work must never be presented in a way that implies a real client,
  commercial engagement, or measured result. Concept projects are never written to the
  `projects` table.
- **E-commerce concept demo** (`/demo/ecommerce`, Slice 3B): Nidery, a fictional home-goods
  brand. Routes in `src/app/demo/ecommerce/` (`(storefront)` group: home, `/shop`,
  `/product/[slug]`, all static); everything else in `src/demo/ecommerce/` (brand, light-theme
  tokens in `styles/demo.css`, fixtures in `data/`, components). Rules:
  - **Isolation:** no LOOKDIT visual components, tokens, `globals.css` or Geist in the demo, and
    no demo code in LOOKDIT. Brand-neutral helpers may be shared. Enforced by directory
    boundaries and review, not a lint rule.
  - **Every demo route is noindex/nofollow** (set once in the demo root layout's metadata).
  - **The demo emits no structured data** (no JSON-LD of any kind) because its products are
    fictional. The product page has a comment on where Product JSON-LD would go in a real store.
  - **Locked disclosure,** on every demo page via the root layout, never edited without
    approval: "LOOKDIT concept demo — fictional products and data. Nothing is for sale."
  - The content rule above applies to demo content too: no real clients, suppliers, reviews,
    ratings, sales labels, stock claims or certifications. Product labels are New/Seasonal only.
  - The LOOKDIT homepage does not link to the demo yet.
  - Images: `DemoImage.src` stays empty until an approved asset exists; `Media` then renders an
    exact-ratio placeholder. Approved assets are required before the demo merges to main.
- Server Components by default. Client components: `MobileMenu` (LOOKDIT) and `StoreMenu` (demo).

## Commands

```bash
pnpm dev                 # local dev server
pnpm build               # production build (run before tsc on a fresh clone)
pnpm lint                # ESLint
pnpm exec tsc --noEmit   # typecheck (strict)
pnpm test                # Vitest unit tests
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
