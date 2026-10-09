import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { PageIntro } from "@/components/site/PageIntro";
import { company, PENDING, privacy } from "@/content/site";

import styles from "./page.module.css";

const DESCRIPTION = "What LOOKDIT collects through this website, why, and how long it keeps it.";
const isDraft = privacy.status === "draft";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  // A draft stays out of search results until it has been legally reviewed.
  robots: isDraft ? { index: false, follow: true } : undefined,
  openGraph: { title: "Privacy policy — LOOKDIT", description: DESCRIPTION, url: "/privacy", siteName: "LOOKDIT", type: "website" },
};

/** A business detail that hasn't been confirmed yet, shown as such. */
function Detail({ value }: { value: string | null }): ReactNode {
  return value ?? <span className={styles.pending}>{PENDING}</span>;
}

/**
 * Every statement here describes what the code does today. Sources:
 * contact form fields and the IP fingerprint in src/db/schema/inquiries.ts and
 * src/lib/inquiries; sign-in cookies in src/lib/auth and src/lib/portal; no
 * analytics or third-party scripts anywhere in src. Change this page whenever
 * that changes. Business details come from `company` and `privacy`.
 */
export default function PrivacyPage() {
  return (
    <article className={styles.page} aria-labelledby="privacy-title">
      <div className={`container ${styles.inner}`}>
        <PageIntro
          label={`${isDraft ? "Draft · " : ""}Last updated ${privacy.lastUpdated}`}
          title="Privacy policy"
          titleId="privacy-title"
          lead={DESCRIPTION}
        />

        {isDraft ? (
          <aside className={styles.draft} aria-label="Draft notice">
            <p className={styles.draftTitle}>Draft, pending legal review</p>
            <p>
              This policy has not been legally reviewed yet. Details marked &ldquo;{PENDING}&rdquo; have not been
              confirmed and will be filled in before the policy is final.
            </p>
          </aside>
        ) : null}

        <div className={styles.body}>
          <section aria-labelledby="who">
            <h2 id="who">Who we are</h2>
            <dl className={styles.facts}>
              <div>
                <dt>Business</dt>
                <dd>{company.name}</dd>
              </div>
              <div>
                <dt>Legal name</dt>
                <dd>
                  <Detail value={company.legalName} />
                </dd>
              </div>
              <div>
                <dt>Country</dt>
                <dd>
                  <Detail value={company.country} />
                </dd>
              </div>
              <div>
                <dt>Privacy contact</dt>
                <dd>
                  {company.privacyEmail ? (
                    <a href={`mailto:${company.privacyEmail}`}>{company.privacyEmail}</a>
                  ) : (
                    <Detail value={null} />
                  )}
                </dd>
              </div>
            </dl>
            {company.privacyEmail ? null : (
              <p>
                Until a privacy contact is confirmed, you can reach us through the{" "}
                <Link href="/#contact">contact form</Link>.
              </p>
            )}
          </section>

          <section aria-labelledby="collect">
            <h2 id="collect">What we collect</h2>
            <p>When you send a message through the contact form we keep:</p>
            <ul>
              <li>your name, email address and message;</li>
              <li>your company name, if you give one;</li>
              <li>the date and time you sent it.</li>
            </ul>
            <p>
              We don&apos;t store your IP address. To limit spam and abuse of the form we keep a one-way, keyed
              fingerprint of it with your message, which on its own doesn&apos;t reveal the address.
            </p>
            <p>Browsing the public pages doesn&apos;t send us any personal information.</p>
          </section>

          <section aria-labelledby="use">
            <h2 id="use">How we use it</h2>
            <p>
              We use your message and contact details to read your inquiry and reply by email. If we go on to work
              together, we keep your name, email and company as a client contact to manage that work.
            </p>
          </section>

          <section aria-labelledby="cookies">
            <h2 id="cookies">Cookies and tracking</h2>
            <p>
              The public website sets no cookies and uses no analytics or advertising trackers. The staff admin and the
              client portal each set one cookie that keeps a signed-in person signed in; it is used for nothing else.
            </p>
          </section>

          <section aria-labelledby="processors">
            <h2 id="processors">Hosting and storage</h2>
            <p>
              The site is hosted on Vercel, which handles standard request data such as IP addresses to serve pages.
              Contact form messages are stored in a PostgreSQL database run by Neon. Images on project pages are stored
              with Vercel Blob; they never contain information you send us.
            </p>
          </section>

          <section aria-labelledby="retention">
            <h2 id="retention">How long we keep it</h2>
            <p>
              <Detail value={privacy.retention} />
            </p>
          </section>

          <section aria-labelledby="rights">
            <h2 id="rights">Your choices</h2>
            <p>
              How to ask what we hold about you, or to have it corrected or deleted:{" "}
              <span className={styles.pending}>{PENDING}</span>
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
