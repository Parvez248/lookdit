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
- **Frontend (in progress):** dark-only "In Focus" design system. `src/app/layout.tsx` holds the
  shell (fonts, skip link, header, footer); `src/app/globals.css` holds the tokens (colour, type,
  space, motion), reset and the `.container` / `.grid` layout primitives.
  - `src/components/site`: header, native `<dialog>` mobile menu, footer, temporary text wordmark.
  - `src/components/ui`: shared primitives (`ButtonLink`, `FocusFrame`).
  - `src/components/home`: home page sections (currently the hero only).
  - `src/content/site.ts`: static site copy and navigation.
- Server Components by default; the only client component so far is `MobileMenu`.

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
