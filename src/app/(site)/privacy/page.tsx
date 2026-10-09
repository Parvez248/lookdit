import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageIntro } from "@/components/site/PageIntro";
import { privacy, privacyPublished } from "@/content/site";

import styles from "./page.module.css";

const DESCRIPTION = "What LOOKDIT collects through this website, why, and how long it keeps it.";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy policy — LOOKDIT", description: DESCRIPTION, url: "/privacy", siteName: "LOOKDIT", type: "website" },
};

/**
 * Every statement here describes what the code does today (contact form fields,
 * the IP fingerprint, sign-in cookies, hosting). Change the page when that
 * changes. Until the business facts in `privacy` are confirmed the page is a
 * 404 and nothing links to it.
 */
export default function PrivacyPage() {
  if (!privacyPublished()) notFound();
  const { legalName, country, email } = privacy.owner;

  return (
    <article className={styles.page} aria-labelledby="privacy-title">
      <div className={`container ${styles.inner}`}>
        <PageIntro
          label={`Last updated ${privacy.lastUpdated}`}
          title="Privacy policy"
          titleId="privacy-title"
          lead={DESCRIPTION}
        />

        <div className={styles.body}>
          <section aria-labelledby="who">
            <h2 id="who">Who we are</h2>
            <p>
              This website is run by {legalName}, trading as LOOKDIT, in {country}. For anything about this policy or
              your information, email <a href={`mailto:${email}`}>{email}</a>.
            </p>
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
            <h2 id="processors">Who processes it</h2>
            <p>
              The site is hosted on Vercel, which handles standard request data such as IP addresses to serve pages.
              Contact form messages are stored in a PostgreSQL database run by Neon.
            </p>
          </section>

          <section aria-labelledby="retention">
            <h2 id="retention">How long we keep it</h2>
            <p>{privacy.retention}</p>
          </section>

          <section aria-labelledby="rights">
            <h2 id="rights">Your choices</h2>
            <p>
              You can ask us what we hold about you, and ask us to correct or delete it, by emailing{" "}
              <a href={`mailto:${email}`}>{email}</a>.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
