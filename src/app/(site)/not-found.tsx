import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { contactCta } from "@/content/site";

import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found",
};

/** 404 inside the public site: a missing or unpublished case study, or a bad link. */
export default function NotFound() {
  return (
    <section className={styles.section} aria-labelledby="not-found-title">
      <div className={`container ${styles.inner}`}>
        <SectionLabel>404</SectionLabel>
        <h1 id="not-found-title" className={styles.heading}>
          This page isn&apos;t here.
        </h1>
        <p className={styles.body}>
          The link may be old, or the page may have moved. Our work and services are a click away.
        </p>
        <div className={styles.actions}>
          <ButtonLink href="/work">See our work</ButtonLink>
          <ButtonLink href={contactCta.href} variant="quiet">
            {contactCta.label}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
