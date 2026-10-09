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
  rate limiting in `src/lib/inquiries`. The DB client comes from `getDb()` (`src/db/index.ts`),
  created on first use so `next build` never needs `DATABASE_URL`.
- **Admin auth** (`/admin`): LOOKDIT staff only, no public sign-up; accounts come from
  `pnpm admin:create-user`. Email + password hashed with Node's built-in scrypt
  (`src/lib/auth/password.ts`); DB sessions (`users`, `sessions`) where the `__Host-` cookie holds
  a random token and the DB stores only its SHA-256; sign-in throttled per email and per IP
  fingerprint (`sign_in_attempts`, HMACs only). Rules:
  - The admin has its own root layout (`src/app/admin/layout.tsx`), always noindex/nofollow.
  - Every admin page and admin Server Action calls `requireUser()` (`src/lib/auth/session.ts`)
    itself. A layout check is never the guard.
  - The sign-in form gives one message for unknown email, wrong password and bad input.
  - Sign-in needs `DATABASE_URL` and `INQUIRY_IP_HMAC_SECRET` at runtime, and fails closed
    without them (or without a trusted client IP).
  - Admin pages so far: dashboard (`/admin`, live inquiry, client and project counts),
    inquiries (`/admin/inquiries` list with status filter and pagination in SQL,
    `/admin/inquiries/[id]` with a status form and "Make client"), clients (`/admin/clients`
    list, `/new`, `/[id]`, `/[id]/edit`) and projects (`/admin/projects`, same four pages). Admin reads in `src/db/queries/inquiries.ts` never select the IP
    fingerprint. Admin timestamps are shown in UTC and labelled.
  - Clients (`clients` table, status lead / active / past) are LOOKDIT's own contacts. An
    inquiry links to at most one client (`inquiries.client_id`, set null if the client is
    deleted). "Make client" copies name, email and company in one SQL statement that locks the
    inquiry, so a double submit cannot create two clients. Validation lives in
    `src/lib/clients/validation.ts`; shared admin list/detail/form styles in `src/components/admin`.
  - Projects reuse the `projects` table. `status` (draft / published / archived) is the public
    publishing switch; `work_status` (planned / active / on_hold / completed / cancelled) is the
    internal workflow; `client_id` links a client (set null on delete) while `client` stays the
    public display text and is never derived from it. New projects start `draft`; the
    Publish / Unpublish button on `/admin/projects/[id]` (`setProjectPublication`) switches
    `draft` ↔ `published`, stamping `published_at` once (COALESCE keeps the first go-live date).
    The project form also edits the public case-study fields (`client`, `live_url` (http(s)
    only), `featured`, `metrics` as `Value | Label` lines, `seo_title`, `seo_description`).
    The slug is generated from the title (-2, -3 … when taken, via
    `ON CONFLICT DO NOTHING`) and never changed by the admin. Admin reads live in
    `src/db/queries/admin-projects.ts`, apart from the public reads, so internal fields never
    reach a public query.
  - Project workspace (on `/admin/projects/[id]`, edit pages under `milestones/` and `tasks/`):
    `project_milestones` (done = `completed_at` set) and `project_tasks` (todo / doing / done,
    optional milestone). Both cascade with their project; a composite FK keeps a task's
    milestone in the same project, and deleting a milestone keeps its tasks
    (`ON DELETE SET NULL (milestone_id)`, hand-written in migration 0007, PostgreSQL 15+).
    Writes match on project id and row id. Progress and overdue rules: `src/lib/workspace`.
  - Project images ("Images" on `/admin/projects/[id]`, `src/components/admin/media`,
    actions in `src/app/actions/admin-media.ts`): uploaded through a Server Action to a public
    **Vercel Blob** store (`@vercel/blob`; needs `BLOB_READ_WRITE_TOKEN`, or the OIDC
    `BLOB_STORE_ID`, which Vercel sets when a store is connected). JPEG / PNG / WebP / AVIF up
    to 4 MB (`serverActions.bodySizeLimit` is 4.5mb, Vercel's request cap); the type is sniffed
    from the bytes, never trusted from the browser. Files go to `projects/<projectId>/` with a
    random suffix. `project_media.storage_key` holds the blob's public URL, and
    `mediaUrl()` (`src/lib/media/url.ts`) is the only reader: anything that isn't an https Blob
    URL under `/projects/` resolves to null (next.config.ts allows only that host and path).
    Alt text is required. Role is hero (one per project; a new hero demotes the old one to
    gallery) or gallery; order is `display_order`. Remove deletes the row, then the file
    (best effort). An upload whose row insert fails deletes its file.
- **Client portal** (`/portal`): read-only, for a client's own contacts. Separate from the
  admin end to end: own root layout (`src/app/portal/layout.tsx`, noindex), own tables
  (`client_accounts`, one per `clients` row; `client_sessions`; `client_sign_in_attempts`), own
  `__Host-lookdit-portal` cookie and own DAL (`src/lib/portal/session.ts`). Same password,
  token and throttle rules as admin auth. Accounts come from `pnpm portal:create-account`
  (re-running it for a client resets the password and signs the account out). Rules:
  - Every portal page calls `requireClient()` itself; it reads only the portal cookie and
    tables. `requireUser()` never accepts a client session, and vice versa.
  - Every portal project read goes through `portalProjectScope(clientId)`
    (`src/db/queries/portal-scope.ts`) with the client id from the session, never from the URL.
    Milestones and tasks load only via `getPortalProjectView()`, after that check. Someone
    else's project is a 404, like a missing one. Cancelled projects are hidden.
  - Clients see every milestone and task of their projects, so nothing internal goes in titles.
- **Frontend (in progress):** dark-only "In Focus" design system. `src/app/(site)/layout.tsx`
  holds the shell (fonts, skip link, header, footer); `src/app/globals.css` holds the tokens
  (colour, type, space, motion), reset and the `.container` / `.grid` layout primitives.
  - `src/components/site`: header, native `<dialog>` mobile menu, footer, and
    `Brand` (the supplied logo in `public/brand/` with the "LOOKDIT" name beside it). The app
    icons `src/app/icon.png` / `apple-icon.png` are the same logo padded to square (temporary).
  - `src/components/ui`: shared primitives (`Badge`, `ButtonLink`, `FocusFrame`, `SectionLabel`).
  - `src/components/portal`: portal header, project card, progress bar and milestone timeline.
  - `src/components/home`: home page sections: `Hero`, `Services`, `Industries`,
    `SelectedWork` (with `CapabilityMap`, the temporary visual for the concept project) and
    `Contact` (`ContactForm` posts to `submitInquiry`; the section owns `id="contact"`).
  - `src/components/specimens`: the "Under the Lens" visual system. `Specimen` renders an
    abstract inline-SVG drawing per service (`seo`, `digital-marketing`, `web-apps`) plus the
    hero `overview`, with Focus Frame corners on the part in focus. Decorative (aria-hidden),
    token colours only, CSS-only load motion that respects reduced motion. Never put numbers
    that read as data, client names or results in a drawing.
  - Inner pages (static, no DB): `/services/[slug]` (one per pillar in `services.items`,
    `dynamicParams = false`, Service JSON-LD; specimen, a brief of hairline rows and the shared
    `Contact` section with a per-service heading), `/about` and `/privacy`. They open with
    `PageIntro` (`src/components/site`); About reuses the home `Services` / `Industries`.
    The footer CTA hides itself (`body:has(#contact)`) on pages that end with the form.
    Company details live in one place, `company` in `src/content/site.ts` (null = not
    confirmed). About lists facts only once they're set. `/privacy` describes what the code
    does, is linked from the footer, and while `privacy.status` is "draft" it is noindex, out of
    the sitemap and shows every unconfirmed detail as "Pending confirmation"; change its copy
    whenever data handling changes.
  - Public portfolio: `/work` and `/work/[slug]` (`src/app/(site)/work`, `src/components/work`)
    read only `src/db/queries/projects.ts` (published rows), are `force-dynamic` so the build
    never needs `DATABASE_URL`, and 404 drafts. The hero image is the `/work` card cover and
    leads the case study (preloaded, also the Open Graph image); gallery images follow it.
    Images render through `MediaImage`, which reserves the stored width/height (or a 16:10
    frame when unknown), so they never shift layout.
  - SEO: `metadataBase` comes from `siteUrl()` (`src/lib/site-url.ts`, Vercel's
    `VERCEL_PROJECT_PRODUCTION_URL`, so previews never claim to be canonical). `src/app/robots.ts`
    keeps `/admin` and `/portal` out; `src/app/sitemap.ts` (force-dynamic) lists home, `/work` and
    published case studies, falling back to the static pages if the DB read fails. The home page
    carries Organization JSON-LD with only facts the site states. Unknown URLs hit
    `(site)/[...missing]` and get the branded `(site)/not-found.tsx`.
  - `src/content/site.ts`: static site copy and navigation. `src/content/work.ts`: the three
    LOOKDIT concept case studies (static, never in the DB), shown at `/work/concepts/[slug]`
    (static) with a concept drawing, gallery `ScreenPlaceholder`s and the `ConceptBadge`
    ("LOOKDIT Concept Project — Demonstration Only.") on every appearance.
  - Homepage Selected Work (`featuredWork()`, `src/lib/work`): published client projects first
    (featured, then display order), topped up with concepts to three; concepts alone if the DB
    read fails. The home page is ISR (`revalidate = 300`), so a newly published project shows
    within five minutes. `/work` lists client work, then the concepts.
- **Content rule:** Selected Work may contain real client work and clearly identified LOOKDIT
  concept work. Concept work must never be presented in a way that implies a real client,
  commercial engagement, or measured result. Concept projects are never written to the
  `projects` table.
- Server Components by default. Client components: `MobileMenu`, `ContactForm`, `SignInForm`
  (`src/components/auth`, shared by admin and portal sign-in), the portal and admin `error.tsx`
  boundaries, and in the admin
  `ClientForm`, `ProjectForm`, the workspace's `InlineAdd` and `WorkspaceEditForm`, the media
  `MediaUploadForm` (measures the image in the browser) and `MediaDetailsForm`, and `AdminNav`
  (reads the path for `aria-current`).

## Commands

```bash
pnpm dev                 # local dev server
pnpm build               # production build (run before tsc on a fresh clone)
pnpm lint                # ESLint
pnpm exec tsc --noEmit   # typecheck (strict)
pnpm test                # Vitest unit tests
pnpm admin:create-user <email> "<name>"  # create an admin account (Node 22.18+)
pnpm portal:create-account <clientId> <email> "<name>"  # create/reset a client portal account
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
