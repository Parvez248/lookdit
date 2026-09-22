---
name: production-code-review
description: >-
  Production-grade code review for Lookdit. Inspects the actual changed code
  (diff / branch / named target) and reports evidence-based issues by severity
  across correctness, architecture, TS/React/Next.js, performance, security,
  accessibility/UX, testing, and maintainability. Reviews only — never rewrites
  unless explicitly asked afterward. Invoke with /production-code-review.
---

# Production Code Review

A read-only, high-signal review workflow. **Report issues; do not modify files.**
Apply fixes only if the user explicitly asks after reading the report.

## Scope

Review the **actual changed code**, not the whole repo. Resolve the target in
this order:

1. An argument the user passed (`/production-code-review <PR # | branch | path>`).
2. Otherwise, discover the change from the working tree using the explicit
   procedure below.

### Change discovery (when no explicit target is supplied)

Do not assume a single `git diff` captures the change. Check every applicable
source:

1. Run `git status --short` first to see the current state.
2. Resolve the base ref safely before any merge-base — do **not** assume a local
   `main` exists: prefer local `main`, else `origin/main`, else none:
   `BASE=$(git rev-parse --verify -q main || git rev-parse --verify -q origin/main)`.
   - If `BASE` resolves and the branch has committed work, identify the
     merge-base (`git merge-base "$BASE" HEAD`) and inspect the branch's
     committed changes relative to it (`git diff <merge-base>...HEAD`).
   - If neither `main` nor `origin/main` exists, report that branch comparison
     cannot be established and **continue** — still review staged, unstaged, and
     untracked working-tree changes. Never abort the whole review over a missing
     base ref.
3. Inspect staged changes (`git diff --cached`).
4. Inspect unstaged changes (`git diff`).
5. Inspect relevant untracked files by opening them directly (they appear in
   `git status --short` as `??` and are not shown by `git diff`).

Rules:

- **Do not review the same change twice.** When committed, staged, and unstaged
  views overlap on the same lines, review each hunk once; note the state only if
  it matters (e.g. a fix exists unstaged over a committed bug).
- **If the current branch is `main`,** skip the merge-base step and still review
  staged, unstaged, and untracked working-tree changes normally.
- **Only declare "no changes to review" after** running `git status` and
  checking all applicable sources (committed-vs-base, staged, unstaged,
  untracked). If all are genuinely empty, say so and stop.

## How to run the review

1. **Read the change first.** Inspect the diff and open the changed files for
   context (surrounding code, call sites, types). Only review code you have read.
2. **Ground every finding in evidence.** Cite a real file and line/range. Do not
   raise speculative or hypothetical issues. If something is a genuine question
   rather than a defect, mark it a NOTE and phrase it as a question.
3. **Honor the project rules.** `CLAUDE.md` is the source of truth (strict TS,
   Server Components by default, DB-side filtering, security needs tests,
   `prefers-reduced-motion`, etc.). Findings should reference the relevant rule
   where one applies.
4. **Stay in scope.** Do not review or propose refactors of unrelated code, and
   do not raise pre-existing issues the change did not touch — unless the change
   directly depends on or worsens them (say which).

## What to inspect, in order

Report in exactly this order. Skip a category cleanly if the change can't
trigger it (e.g. no DB code → no DB findings) rather than padding it.

1. **Correctness** — logic errors, broken assumptions, unhandled edge cases,
   error handling, async/await and promise mistakes, off-by-one, null/undefined.
2. **Architecture** — unnecessary coupling, unclear responsibilities, weak
   module/component boundaries, overengineering, duplicated logic.
3. **TypeScript / React / Next.js** — type safety and unjustified `any`
   (prefer `unknown` + narrowing), Server vs Client Component choice (`"use client"`
   pushed too high), unnecessary state/effects, missing cleanup, needless
   re-renders / unstable deps, and current App-Router patterns (async server
   components, `use`, route handlers, caching/`fetch` semantics — verify against
   the installed Next version's docs, not memory).
4. **Performance** — avoidable work, O(n²)+ hot paths, wrong data structures,
   excess client JS/bundle, image/font/media handling, layout thrash / CLS,
   and DB query concerns (N+1, missing indexes, in-memory filtering that
   belongs in the query) when relevant.
   - Flag obvious data-layer problems here, but deep schema, index, migration,
     transaction, query-plan, and PostgreSQL analysis belongs to
     `/database-dsa-review` — aim for complementary review, not duplicate DB
     findings.
5. **Security** — trust boundaries, input validation, authn/authz impact,
   unsafe data handling, exposed secrets, injection and access-control risks.
   Treat auth, validation, DB mutations, payments, and secrets as high-scrutiny
   by default. If security behavior cannot be established from the available
   code/context, do not invent a vulnerability — mark the uncertainty as a NOTE
   and identify exactly what must be verified.
6. **Accessibility / UX** — semantic HTML, keyboard operability, visible focus,
   contrast, `prefers-reduced-motion` fallbacks, and mobile/touch behavior.
7. **Testing** — missing tests for critical logic, weak assertions, untested
   failure/error paths, and regression risk introduced by the change.
8. **Maintainability** — readability, naming, unnecessary abstractions,
   dependency justification (why it's needed + its cost), and whether docs
   (`CLAUDE.md`, README) must be updated because behavior/architecture changed.

## Severity levels

- **CRITICAL** — breaks correctness/security in production; must fix before merge.
- **HIGH** — likely bug, security/perf risk, or clear rule violation; fix before merge.
- **MEDIUM** — real issue with limited blast radius; should fix.
- **LOW** — minor; fix if convenient.
- **NOTE** — question, context, or tradeoff to confirm — not necessarily a defect.

## Output format

Lead with a one-line verdict and a severity tally. Then list findings grouped by
the eight categories above, **preserving that order for the categories that
appear**. For each finding:

- **[SEVERITY] `path/to/file.ts:line`** — <what is wrong>
  - **Why it matters:** <impact / which rule or user it affects>
  - **Recommended fix:** <concrete change; a short snippet only if it clarifies>

Rules for the report:

- **Only include categories that contain meaningful findings.** Do **not** output
  empty "No issues found" sections for categories with nothing to report.
- **No unnecessary praise**, no filler.
- **No stylistic nitpicks** unless they materially hurt maintainability.
- Keep it concise and high-signal; more findings is not better.
- **If the change has no meaningful issues, say so plainly** —
  "No meaningful issues found in the reviewed change." — **omit the empty finding
  sections, and proceed directly to the verification checklist.** A clean review
  is a valid result.
- **Do not modify any files.** End by offering to apply specific fixes only if
  the user wants them.

## Verification checklist

Close **every** review — including a clean one — with this checklist.

Reporting discipline:

- If a command **was actually run**, report its real pass/fail result.
- If it **was not run**, report `not run — <specific reason>` and never present
  it as passing.
- **Never present a previous baseline result as if it were a current run.**
  Historical green checks may be mentioned only as context, clearly labeled as
  previous results.
- For **documentation-only or agent-config-only** changes, it is acceptable not
  to run application lint/typecheck/build when they cannot exercise the changed
  file — report each as `not run — <specific reason>`.
- If **no test command exists**, report `not configured` rather than implying
  tests passed.

- [ ] **Lint** — `pnpm lint`
- [ ] **Typecheck** — `pnpm exec tsc --noEmit` (strict mode)
- [ ] **Tests** — the project's test command (`not configured` if none exists);
      note any missing coverage the diff needs
- [ ] **Production build** — `pnpm build`
- [ ] **Runtime / manual** — the specific flows or states a human should verify
      for this change (routes, interactions, reduced-motion, mobile/touch)
