# LOOKDIT — backlog

State at the development pause on 9 October 2026 (`main` @ `43fc73c`). Context in
[`HANDOFF.md`](./HANDOFF.md). Tick items off here as they are done.

## 1. Critical before commercial launch

- [ ] **Confirm the production deployment.** In Vercel, check the deployment of `43fc73c`
      (PR #28) is Ready and the live site loads `/`, `/work`, `/privacy` and a concept page.
      (Unverified at the pause: not visible from the development environment.)
- [ ] **Clean up test projects.** Unpublish (or delete) any test projects in the production
      database from `/admin/projects`; published ones show on the home page and `/work`.
      Owner's action; no one else changes production data.
- [ ] **Verify case-study images.** Upload a Hero and a Gallery image on a published project;
      confirm the hero is the `/work` card cover and leads `/work/<slug>`, with the gallery below.
      (Admin upload already verified on a Preview.)
- [ ] **Verify Blob deletion.** Remove an image in the admin; confirm it disappears from the
      case study and the file is gone from the Vercel Blob store (Storage → Blob → `projects/`).
- [ ] **Privacy policy legal review.** Supply the facts in §4, have the policy reviewed, update
      the text, then set `privacy.status = "final"` in `src/content/site.ts` (makes it indexable
      and adds it to the sitemap). Re-review whenever data handling changes.
- [ ] **Real portfolio.** Publish at least one real case study with the client's permission and
      authentic screenshots, so the home page doesn't rely only on concept projects.
- [ ] **Confirm the production domain** in Vercel, so canonical URLs, the sitemap and Open Graph
      use it (they follow `VERCEL_PROJECT_PRODUCTION_URL`).
- [ ] **Confirm the production database is at migration `0008`** (reported applied 2026-10-08).
- [ ] **Decide how inquiries reach staff.** There is no email notification; until one exists,
      someone must check `/admin/inquiries` regularly.

## 2. Optional UX/UI improvements

Noted after the "Under the Lens" approval (PR #27). Refinements, not a redesign.

- [ ] Reduce vertical whitespace slightly in the service sections (home rows and service pages).
- [ ] Raise the contrast of the small labels inside the specimen drawings.
- [ ] Revisit the hero copy for stronger commercial positioning (copy needs approval).
- [ ] Replace the temporary app icons (`src/app/icon.png`, `apple-icon.png`) with purpose-made ones.
- [ ] Replace concept gallery placeholders with designed demo screens, if concepts stay on the site.

## 3. Features planned for later

- [ ] Email notification for new inquiries (new external service: needs approval and a privacy
      policy update).
- [ ] Testimonials on the public site (`testimonials` table exists, unused) once real, approved
      testimonials exist.
- [ ] Nidery e-commerce demo: PR #12 is open and parked ("do not merge" until real imagery);
      it needs rebasing onto current `main` before any review.
- [ ] Sub-service ("focus areas") sections on the service pages, once sub-services are confirmed.
- [ ] Revalidate the home page on publish, so new projects appear immediately instead of within
      5 minutes.
- [ ] Analytics, only if needed, with a matching privacy policy update.

## 4. Business information awaiting confirmation

Fill these in `src/content/site.ts` (`company`, `privacy`); every page picks them up.

- [ ] Registered legal business name (`company.legalName`).
- [ ] Privacy contact email (`company.privacyEmail`).
- [ ] Inquiry and client data retention period (`privacy.retention`).
- [ ] How people request access, correction or deletion (the pending "Your choices" sentence in
      `src/app/(site)/privacy/page.tsx`).
- [ ] Founding year and team size, optional (`company.founded`, `company.team`; shown on About).
- [ ] Sub-services per pillar, optional (`focusAreas` per service).
- [ ] Real client projects and permission to publish them, with screenshots.

Confirmed so far: services (SEO, Digital Marketing, Web Apps Development), the four priority
industries, and Bangladesh as the operating country.
