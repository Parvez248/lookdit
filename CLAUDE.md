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
- **Tailwind CSS and/or custom CSS** — chosen per case; keep styling coherent.
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

Empty repository — not yet scaffolded. When scaffolding lands, replace this section with the real
project structure and fill in the commands below.

## Commands

_To be filled in once the project is scaffolded (e.g. dev, build, lint, typecheck, test)._

<!--
dev:        <tbd>
build:      <tbd>
lint:       <tbd>
typecheck:  <tbd>
test:       <tbd>
-->
