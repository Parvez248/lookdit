---
name: database-dsa-review
description: >-
  Database + data-structure review for Lookdit's production changes. Inspects the
  actual changed DB-related code (schema, migrations, queries, data-access) and
  reports evidence-based findings by severity across schema correctness, query
  design, indexing, transactions/consistency, DSA/complexity, PostgreSQL specifics,
  migration safety, security/privacy, validation boundaries, and testing. Reviews
  only — never rewrites schema or queries unless explicitly asked afterward.
  Invoke with /database-dsa-review.
---

# Database & DSA Review

A read-only, high-signal review for **database and data-structure** concerns.
**Report issues; do not modify files.** Apply fixes only if the user explicitly
asks after reading the report. This skill is the DB/DSA counterpart to
`production-code-review`; it does **not** re-review general correctness/UI —
see "Scope boundary" below.

## Scope

Review the **actual changed DB-related code**, not the whole repo. Resolve the
target in this order:

1. An argument the user passed (`/database-dsa-review <PR # | branch | path>`).
2. Otherwise, discover the change from the working tree (procedure below).

### Change discovery (when no explicit target is supplied)

Do not assume a single `git diff` captures the change. Check every source:

1. Run `git status --short` first.
2. Resolve the base ref safely — do **not** assume a local `main` exists: prefer
   local `main`, else `origin/main`, else none:
   `BASE=$(git rev-parse --verify -q main || git rev-parse --verify -q origin/main)`.
   - If `BASE` resolves and the branch has committed work, inspect committed
     changes vs the merge-base (`git merge-base "$BASE" HEAD` → `git diff <mb>...HEAD`).
   - If neither exists, report that branch comparison cannot be established and
     **continue** with staged/unstaged/untracked. Never abort over a missing base.
   - **When the current branch is `main`,** the dedicated main-branch rule below
     determines the remote/upstream baseline for committed-diff inspection (a
     local `main` base would just be `HEAD` itself).
3. Inspect staged changes (`git diff --cached`).
4. Inspect unstaged changes (`git diff`).
5. Inspect relevant untracked files by opening them (`??` in `git status --short`).

Rules:
- **Do not review the same hunk twice** (when committed/staged/unstaged views
  overlap, review each hunk once; note the state only if it matters).
- **If the current branch is `main`,** do **not** ignore committed changes:
  resolve its upstream (or `origin/main`) when available; if `HEAD` differs from
  that remote/upstream baseline, inspect that committed diff
  (`git diff <upstream>..HEAD`). If `HEAD` equals the baseline, there is simply
  no committed diff to review. Then separately inspect staged, unstaged, and
  relevant untracked files.
- **Only declare "no changes to review"** after checking all applicable sources.

### Scope boundary (what this skill reviews)

In-scope files: schema/model definitions, migrations, seeds, query/data-access
layers, DB config, and the server code that reads/writes the database or object
storage. **Out of scope:** UI/rendering, styling, React/Next component structure,
and general logic unrelated to data — those belong to `production-code-review`.
If the change contains **no** DB-related code, say so and stop (don't invent DB
findings in a UI-only diff).

## How to run the review

1. **Read the change first.** Open the changed schema/migration/query files and
   their call sites. Only review code you have read.
2. **Ground every finding in evidence** — cite a real file and line/range. No
   speculative issues. A genuine open question is a NOTE phrased as a question.
3. **Honor Lookdit's data architecture** (below) and `CLAUDE.md` (rule 11:
   DB-side filtering/sorting; rule 12: security needs reasoning + tests).
4. **Distinguish correctness from optimization**, and **do not invent scale
   problems.** If a concern depends on data volume/workload not known here, mark
   it NOTE and state exactly what must be measured.

### Review-only guarantee (no repository mutation)

This skill must not change the reviewed diff as a side effect of verification.

- **Do not run schema-generation or migration-generation commands if they write
  or modify repository artifacts** (schema files, migration files, generated
  clients checked into the repo, config).
- If a **non-writing validation / dry-run mode** exists, it may be used.
- Otherwise, **inspect the already-generated schema/migration artifacts** in the
  diff and report the generation step as
  `not run — generation would modify repository files`.
- Normal verification commands (typecheck, build) **may create ignored/ephemeral
  build artifacts** (e.g. `.next/`, caches) — that is acceptable. The skill must
  **never intentionally edit tracked source, schema, migration, or config
  files**, and must not stage, commit, or push anything.

### Database safety (verification must not harm data)

- **Never run `EXPLAIN ANALYZE` on mutating statements** (INSERT/UPDATE/DELETE,
  DDL, or anything with side effects) against production or shared data —
  `EXPLAIN ANALYZE` executes the statement.
- For mutating queries, use **plain `EXPLAIN`** (plan only, no execution) where
  useful.
- **`EXPLAIN ANALYZE` for writes is allowed only against an isolated
  scratch/test database.**
- **Never apply a migration to production** as part of review verification.
- **Migration dry-runs/tests must use a scratch/test database** unless the user
  explicitly authorizes otherwise.

## Lookdit data architecture (the rules findings must respect)

- **PostgreSQL** is the source of truth for queryable metadata + relationships.
- **MDX** owns long-form project narrative only; **static** code owns Services,
  Team, and site constants; **object storage** owns media binaries.
- **Never** store media binaries in PostgreSQL.
- **Project ↔ Technology** is a real M:N relation (join table), not free-text tags.
- Prefer **DB-side** filtering/sorting for DB-backed data.
- **Do not add an index without a real query pattern**; do not optimize tiny
  reference tables for theoretical Big-O.
- **Inquiry** and **auth/admin** tables are security-sensitive (privacy, authz).
- **DB + object storage/email are not atomic** — review compensation/idempotency.
- Avoid generic-CMS complexity; every column/table must earn its place.

## What to inspect, in order

Report in this order. Skip a category cleanly if the change can't trigger it
(e.g. no migration in the diff → no migration findings) rather than padding it.

1. **Schema correctness** — entity boundaries; required vs optional; PKs; FKs;
   unique constraints; CHECK constraints; referential integrity;
   cascade/restrict/set-null behavior; source-of-truth duplication (e.g. metadata
   in both MDX and PG); unnecessary columns/tables; normalization vs justified
   denormalization.
2. **Query design** — filtering/sorting in DB vs needlessly in memory; N+1;
   unnecessary round trips; over-fetching; missing predicates; unstable ordering
   (missing tiebreaker); pagination when relevant; whether the query matches the
   real access pattern.
3. **Indexing** — indexes correspond to real queries; missing composite indexes;
   wrong column order; redundant indexes; indexes on tiny tables that don't earn
   their cost; **reverse M:N lookup** support; uniqueness that should be a
   constraint/index. When recommending an index, **name the query it serves and
   justify the column order.**
4. **Transactions & consistency** — what must be atomic; transaction boundaries;
   **network/email/object-storage calls inside a transaction** (flag); race
   conditions; idempotency; retry safety; concurrent writes; dual-write problems
   (DB + object storage/email).
5. **DSA / complexity** — **application-side** time/space complexity where
   materially relevant; O(n²)+ app-side work; Map/Set vs repeated array scans;
   dedup; canonical lookup structures; sort/search strategy; **work that belongs
   in SQL, not JS.** Do not force algorithm discussion where data volume makes it
   irrelevant.
   - **SQL is not analyzed with simplistic Big-O labels.** For SQL, reason about
     **access path, estimated/actual row counts, cardinality, selectivity, join
     strategy, indexes, sort/hash operations, and the `EXPLAIN` plan** — not
     `O(n)`/`O(log n)` tags, because actual behavior depends on the PostgreSQL
     planner and data distribution. Apply Big-O only to application-side code.
6. **PostgreSQL-specific** — planner implications; EXPLAIN/EXPLAIN ANALYZE when
   useful (subject to the Database safety rules above); locking;
   isolation/concurrency; CITEXT / case-normalization; JSONB only when justified;
   `text`+CHECK consistency; UUID vs int key trade-offs; migration safety.
7. **Migration review** — destructive changes; data-loss risk; NOT NULL additions
   on populated tables; constraint introduction on existing data; backfills;
   rename vs drop/recreate; rollback/recovery; production-safe sequencing.
8. **Security / privacy** — public vs private data exposure; authz around DB
   reads/writes; raw PII storage; IP/privacy handling (HMAC, not raw/unsalted);
   parameterized queries; unsafe dynamic SQL; secrets; ownership/tenant checks
   where applicable. Inquiry + admin/auth are high-scrutiny by default. If
   security behavior can't be established from the code/context, do not invent a
   vulnerability — mark a NOTE and name what must be verified.
9. **Validation boundaries** — what must be validated in application code; what
   should **also** be enforced by DB constraints; where relying on frontend-only
   validation is unsafe.
10. **Testing** — schema/migration tests where justified; transaction/failure-path
    tests; authorization tests; race-condition tests when relevant; important
    query-behavior tests.

## Severity levels

- **CRITICAL** — data loss/corruption, security/privacy breach, or a migration
  that breaks production; must fix before merge.
- **HIGH** — likely bug, integrity gap, unsafe migration, or clear rule violation;
  fix before merge.
- **MEDIUM** — real issue with limited blast radius; should fix.
- **LOW** — minor; fix if convenient.
- **NOTE** — question, context, or a concern that depends on unknown
  volume/workload — state what must be measured.

## Output format

Lead with a one-line verdict and a severity tally. Then list findings grouped by
the ten categories above, **preserving that order for the categories that
appear**. For each finding:

- **[SEVERITY] `path/to/file:line`** — <what is wrong>
  - **Why it matters:** <impact / which rule, user, or invariant it affects>
  - **Access pattern:** <the query/operation involved, when applicable>
  - **Recommended fix:** <concrete change; for an index, the query it serves and
    the column order; a short snippet only if it clarifies>

Rules for the report:

- **Only include categories with meaningful findings** — no empty "No issues"
  sections.
- No unnecessary praise, no filler, no stylistic nitpicks.
- **Distinguish correctness from optimization** in the wording.
- **Do not recommend Redis/caches/search engines/partitioning/read-replicas**
  without evidence in the diff or a measured need; **do not recommend an index
  just because a column appears in a WHERE.**
- Keep it concise and high-signal; more findings is not better.
- **If there are no meaningful DB/DSA issues, say so plainly** —
  "No meaningful database/DSA issues found in the reviewed change." — omit the
  empty sections and proceed to the verification checklist. A clean review is
  valid.
- **Do not modify any files.** End by offering to apply specific fixes only if
  the user asks.

## Verification checklist

Close **every** review — including a clean one — with this checklist.

Reporting discipline:

- If a command **was actually run**, report its real result.
- If it **was not run**, report `not run — <specific reason>`; never present it
  as passing.
- If a tool/step **does not exist yet**, report `not configured`.
- **Never present a previous baseline result as if it were a current run.**
  Historical results may be cited only as context, clearly labeled as previous.

Run/inspect what the change and environment allow, then report real results:

- [ ] **Schema generation** — non-writing validate/dry-run only; otherwise
      `not run — generation would modify repository files` and inspect the
      committed artifacts instead.
- [ ] **Migration generation** — same rule: dry-run/validate only, else
      `not run — generation would modify repository files`.
- [ ] **Migration diff review** — read the migration SQL/plan for destructive or
      unsafe operations (report findings above).
- [ ] **Typecheck** — `pnpm exec tsc --noEmit` (strict mode)
- [ ] **Tests** — the project's test command (`not configured` if none); note any
      missing DB/failure-path/authz coverage.
- [ ] **Production build** — `pnpm build`
- [ ] **DB-specific** — plain `EXPLAIN` on a changed read query, or a **migration
      dry-run / `EXPLAIN ANALYZE` only against an isolated scratch DB**. Never
      `EXPLAIN ANALYZE` a mutating statement on production/shared data; never
      apply a migration to production. `not run — <specific reason>` when no
      scratch DB is available here.
