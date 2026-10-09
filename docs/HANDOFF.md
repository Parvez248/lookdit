# LOOKDIT — development handoff

Snapshot at the development pause on **9 October 2026**, `main` @ `43fc73c` (PR #28).
Website development is paused while LOOKDIT works on company setup, operations, service
offerings, pricing and client acquisition. Use this file, [`BACKLOG.md`](./BACKLOG.md) and
[`../CLAUDE.md`](../CLAUDE.md) (engineering rules and the detailed state of every area) to resume.

Statements marked **unverified** could not be confirmed from the development environment.

---

## 1. Overview and objectives

LOOKDIT's company website: a public marketing and portfolio site, a staff admin for inquiries,
clients and projects, and a read-only client portal for project progress.

Priorities, in order: UI/UX quality, accessibility, performance, maintainable architecture.
The design is original ("In Focus" design system, "Under the Lens" visual language); qubetix.co
was a reference for polish only.

## 2. Confirmed business positioning

From `src/content/site.ts` (v1 positioning approved 2026-10-05):

- **Services (three equal pillars):** SEO, Digital Marketing, Web Apps Development.
- **Priority industries:** E-commerce; Healthcare & Clinics; Home Services; Residential &
  Commercial Construction Services. Priority areas, not exclusive markets.
- **Operating country:** Bangladesh (confirmed 2026-10-09).
- **Hero line:** "Digital work that holds up to a closer look."
- Not confirmed (shown nowhere or as "Pending confirmation"): legal name, privacy email,
  founding year, team size, sub-services per pillar. See `BACKLOG.md` §4.

## 3. Technology stack and architecture

| Area | Choice |
| --- | --- |
| Framework | Next.js 16.3 (App Router), React 19, TypeScript strict |
| Styling | CSS Modules + CSS custom-property tokens (`src/app/globals.css`); no Tailwind |
| Database | PostgreSQL 18 on Neon, Drizzle ORM, `@neondatabase/serverless` HTTP driver |
| Validation | Zod |
| Images | Vercel Blob (public store), `next/image` limited to that host and `/projects/**` |
| Tests | Vitest (unit) |
| Hosting | Vercel; `main` deploys to production, every branch gets a Preview |
| CI | GitHub Actions `.github/workflows/ci.yml`: build, typecheck, lint, tests on PRs and `main` |

Runtime dependencies are only `next`, `react`, `react-dom`, `drizzle-orm`,
`@neondatabase/serverless`, `@vercel/blob`, `zod`. No GSAP, Lenis or Three.js yet: they are
allowed by the guidelines but only when a feature needs them.

Architecture in brief:

- **Three separate root layouts:** `src/app/(site)` (public), `src/app/admin` (noindex),
  `src/app/portal` (noindex). Admin and portal share no session, cookie or table.
- **Server Components by default**; client components are small leaves (forms, mobile menu,
  admin nav). Full list in `CLAUDE.md`.
- **Data access:** reads in `src/db/queries`, writes in `src/db/mutations`, called only from
  Server Actions in `src/app/actions`. `getDb()` connects on first use, so `next build` never
  needs `DATABASE_URL`.
- **Public pages** that read the DB (`/work`, `/work/[slug]`, `sitemap.ts`) are `force-dynamic`;
  the home page is ISR (`revalidate = 300`) and falls back to concept projects if the DB read
  fails. Everything else public is static.
- **Content** that is not in the DB lives in `src/content/site.ts` (copy, navigation, company
  details, privacy status) and `src/content/work.ts` (concept projects).

## 4. Repository and deployment

- **Repository:** https://github.com/Parvez248/lookdit (default branch `main`).
- **Vercel project:** `lookdit` in the `parvez248s-projects` team. Production deploys from `main`.
  Preview URLs follow `lookdit-git-<branch>-parvez248s-projects.vercel.app`.
- **Production domain:** not recorded in the repo; the site's canonical URL comes from Vercel's
  `VERCEL_PROJECT_PRODUCTION_URL` at runtime (`src/lib/site-url.ts`). Check the domain in Vercel.
- **Production deployment of `43fc73c`: unverified.** CI passed on `main` for that commit
  (GitHub Actions run 37948588485). The development environment could not read Vercel's
  deployment status or reach the live site. Confirm "Ready" in the Vercel dashboard.
- **Production database:** migrations `0000`–`0008` exist in `drizzle/`. Migration `0008` was
  reported applied to production on 2026-10-08 (unverified). No migration was added after it.
  Migrations are applied manually, never by a deploy.
- **No `vercel.json`.** Deploy settings live in the Vercel dashboard.

## 5. Public website pages

| Route | What it is | Data |
| --- | --- | --- |
| `/` | Hero, services, industries, Selected Work, contact form | ISR; DB for Selected Work |
| `/services/seo`, `/services/digital-marketing`, `/services/web-apps` | One page per pillar, with the contact form | Static |
| `/about` | Positioning, services, industries; facts appear once confirmed | Static |
| `/work` | Published projects from the DB, then the three concept projects | Dynamic |
| `/work/[slug]` | Published case study (hero image, gallery, metrics, live link) | Dynamic |
| `/work/concepts/[slug]` | Three LOOKDIT concept case studies (demonstration only) | Static |
| `/privacy` | Privacy policy **draft**: public, footer-linked, noindex, out of the sitemap | Static |
| `/sitemap.xml`, `/robots.txt` | Sitemap (DB-backed, falls back to static pages); robots keeps `/admin`, `/portal` out | Dynamic |
| anything else | Branded 404 | — |

The contact form (home, service pages) posts to the `submitInquiry` Server Action.

## 6. Admin dashboard (`/admin`)

Staff only, no public sign-up. Every page and admin Server Action calls `requireUser()` itself.

- **Dashboard:** live inquiry, client and project counts.
- **Inquiries:** list with status filter and pagination (in SQL); detail with status changes and
  "Make client" (creates a client from the inquiry, safe against double submits).
- **Clients:** list, create, view, edit (status lead / active / past).
- **Projects:** list, create, view, edit; Publish / Unpublish; public case-study fields (client
  display text, live URL, featured, metrics, SEO title/description); slug generated from the title.
- **Project workspace:** milestones and tasks (todo / doing / done) with progress and overdue rules.
- **Project images:** upload to Vercel Blob (JPEG/PNG/WebP/AVIF, ≤ 4 MB, type sniffed from bytes),
  required alt text, hero or gallery role, ordering, remove.

Accounts: `pnpm admin:create-user <email> "<name>"`.

## 7. Client portal (`/portal`)

Read-only, for a client's own contacts. Separate cookie, tables and data-access layer from the
admin. Clients see their own projects (cancelled hidden), with milestones, tasks and progress.
Every read is scoped by the client id from the session (`portalProjectScope`); another client's
project is a 404. Accounts: `pnpm portal:create-account <clientId> <email> "<name>"` (re-running
resets the password and signs the account out).

## 8. Database and integrations

Tables (schema in `src/db/schema`, SQL in `drizzle/`):

- **Content:** `projects`, `project_media`, `technologies`, `project_technologies`,
  `testimonials` (table exists; nothing reads or writes it yet).
- **Inquiries:** `inquiries` (stores a keyed IP fingerprint, never the IP).
- **CRM / delivery:** `clients`, `project_milestones`, `project_tasks`.
- **Admin auth:** `users`, `sessions`, `sign_in_attempts`.
- **Portal auth:** `client_accounts`, `client_sessions`, `client_sign_in_attempts`.

Integrations: **Neon** (PostgreSQL), **Vercel** (hosting), **Vercel Blob** (project images).
There is **no email integration**: new inquiries are only visible in the admin.

## 9. Authentication and security

- Passwords hashed with Node's built-in scrypt (`src/lib/auth/password.ts`).
- DB sessions: the cookie holds a random token, the DB stores only its SHA-256. Cookies
  `__Host-lookdit-session` (admin) and `__Host-lookdit-portal` (portal), 7-day lifetime.
- Sign-in throttle: 5 attempts per email and 20 per IP fingerprint per 15 minutes; stored as HMACs.
  One error message for unknown email, wrong password and bad input.
- Inquiry rate limit: 5 successful inquiries per IP fingerprint per hour.
- Client IP is trusted from `x-real-ip` only on Vercel (`VERCEL=1`); sign-in fails closed without
  `DATABASE_URL`, `INQUIRY_IP_HMAC_SECRET` or a trusted IP. This is Vercel-specific: another host
  needs a code change.
- Admin and portal are noindex and excluded in `robots.txt`; admin reads never select the IP
  fingerprint; public queries never select internal project fields.
- Uploaded image URLs are only rendered through `mediaUrl()`, which rejects anything that is not
  an https Blob URL under `/projects/`.

## 10. Environment variables (names only)

Template: [`.env.example`](../.env.example). Copy to `.env.local` locally; production values live
in the Vercel project's environment settings. Never commit real values.

| Name | Needed for |
| --- | --- |
| `DATABASE_URL` | Runtime DB (pooled). Admin, portal, contact form, `/work`. |
| `DATABASE_URL_UNPOOLED` | `drizzle-kit` migrations (direct connection). |
| `INQUIRY_IP_HMAC_SECRET` | IP/email fingerprints for rate limits; ≥ 43 chars (`openssl rand -base64 32`). |
| `BLOB_READ_WRITE_TOKEN` | Image uploads locally; on Vercel the connected store sets it. |
| `BLOB_STORE_ID` | Alternative to the token on Vercel (OIDC), set when a store is connected. |
| `VERCEL`, `VERCEL_PROJECT_PRODUCTION_URL`, `NODE_ENV` | Set by the platform; not configured by hand. |

## 11. Completed features and merged PRs

| PR | Change |
| --- | --- |
| #1–#4 | Code-review skills, PostgreSQL foundation, typed read-only data access |
| #5–#7 | Inquiry service, request boundary, abuse protection (rate limit, fingerprints) |
| #8–#11 | Brand and positioning, homepage services and industries, nav fixes, Selected Work concept |
| #13–#18 | Admin: auth, dashboard and inquiries, clients, projects, project workspace, visual polish |
| #19 | Client portal |
| #20 | Public contact form wired to `submitInquiry` |
| #21–#23 | Project publishing and public `/work`, case-study fields, image uploads (Vercel Blob) |
| #24 | CI, `.env.example`, README |
| #25 | SEO: sitemap, robots, canonical, JSON-LD, branded 404 |
| #26 | Service pages, About, gated privacy policy |
| #27 | "Under the Lens" visual system (homepage and service pages) |
| #28 | Privacy draft published (noindex), three concept case studies, dynamic Selected Work |

**Open, parked:** PR #12 "Nidery ecommerce demo foundation" (`feat/ecommerce-demo-foundation`).
Marked "do not merge" until real imagery exists; it predates the admin work and would need
rebasing onto current `main`. Left open, untouched.

All other remote branches belong to merged PRs. Nothing uncommitted was left behind.

## 12. Known issues and limitations

- Production deployment status of the last merge is unverified (see §4).
- Published test projects in the production DB, if any, appear on the home page and `/work`
  with a neutral "Case study" label. Unpublish them before launch.
- Privacy policy is a draft with pending legal identity, contact, retention and rights text.
- No email notification for new inquiries; staff must check `/admin/inquiries`.
- Home page is cached for up to 5 minutes; a newly published project can take that long to
  appear there (`/work` is immediate).
- Concept case-study galleries are labelled image placeholders.
- `testimonials` table is unused.
- App icons (`src/app/icon.png`, `apple-icon.png`) are the logo padded to square, temporary.
- Client IP trust is Vercel-specific (see §9).

Launch blockers and everything else outstanding: [`BACKLOG.md`](./BACKLOG.md).

## 13. Demo content and placeholders

| What | Where |
| --- | --- |
| Company facts (`null` = not confirmed) | `company` in `src/content/site.ts` |
| Privacy status (`draft` / `final`), retention, last-updated date | `privacy` in `src/content/site.ts` |
| "Pending confirmation" label text | `PENDING` in `src/content/site.ts` |
| All public copy and navigation | `src/content/site.ts` |
| Concept projects (e-commerce, healthcare, dashboard) and the disclosure text | `src/content/work.ts` |
| Concept drawings | `src/components/specimens/Specimen.tsx` |
| Gallery image placeholders | `src/components/work/ScreenPlaceholder.tsx` (driven by `gallery` in `work.ts`) |

Rules: concept projects are never written to the `projects` table and always carry
"LOOKDIT Concept Project — Demonstration Only."; drawings never contain numbers that read as
data, client names or results.

To publish the privacy policy once facts are confirmed: fill `company.legalName`,
`company.privacyEmail`, `privacy.retention`, replace the pending rights sentence in
`src/app/(site)/privacy/page.tsx`, update `privacy.lastUpdated`, then set
`privacy.status = "final"` (makes it indexable and adds it to the sitemap).

## 14. Run, test, deploy, resume

**Run locally** (Node 22.18+, pnpm as pinned in `package.json`):

```bash
pnpm install
cp .env.example .env.local   # fill in values; public pages run without any
pnpm dev                     # http://localhost:3000
```

**Checks** (the same as CI):

```bash
pnpm build               # first: generates the route types tsc needs
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

**Deploy:** open a PR → CI and a Vercel Preview run → review the Preview → squash-merge to `main`
→ Vercel deploys production. Schema changes: add a migration in `drizzle/`, apply it to
production deliberately with `drizzle-kit` (`DATABASE_URL_UNPOOLED`) before merging code that
needs it.

**Resume development:**

1. Pull `main`, run the four checks above, and confirm the latest production deployment is
   Ready in Vercel.
2. Read `CLAUDE.md` (rules and current state), this file and `BACKLOG.md`.
3. Clear the launch-critical items in `BACKLOG.md` §1 first; most need business facts from §4.
4. Work in small PRs; nothing merges without the owner's approval of the Preview.
