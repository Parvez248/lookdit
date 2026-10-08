# Lookdit

LOOKDIT's company site: the public portfolio, a staff admin (inquiries, clients, projects,
case-study images) and a read-only client portal.

Next.js (App Router) + React + strict TypeScript, CSS Modules with design tokens, PostgreSQL 18
on Neon via Drizzle, images on Vercel Blob. Hosted on Vercel; `main` deploys to production.

Architecture, rules and the current state of every area are in [CLAUDE.md](./CLAUDE.md).

## Setup

Requires Node 22.18+ and pnpm (the version is pinned in `package.json`).

```bash
pnpm install
cp .env.example .env.local   # then fill in the values (see the comments in the file)
pnpm dev                     # http://localhost:3000
```

The public pages build and render without a database. The admin, portal, contact form and
`/work` need `DATABASE_URL`, and sign-in also needs `INQUIRY_IP_HMAC_SECRET`.

## Commands

```bash
pnpm build               # production build (run before tsc on a fresh clone)
pnpm exec tsc --noEmit   # typecheck
pnpm lint                # ESLint
pnpm test                # Vitest unit tests
pnpm admin:create-user <email> "<name>"                 # create an admin account
pnpm portal:create-account <clientId> <email> "<name>"  # create/reset a client portal account
```

CI (`.github/workflows/ci.yml`) runs build, typecheck, lint and tests on every pull request.

## Database

Schema in `src/db/schema`, SQL migrations in `drizzle/` (PostgreSQL 18: `uuidv7()`).
`drizzle-kit` reads `DATABASE_URL_UNPOOLED` from `.env.local`. Migrations are applied to
production deliberately, never as part of a deploy.
