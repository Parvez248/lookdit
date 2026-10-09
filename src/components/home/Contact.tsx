import { SectionLabel } from "@/components/ui/SectionLabel";
import { contact } from "@/content/site";

import { ContactForm } from "./ContactForm";
import styles from "./Contact.module.css";

type ContactProps = {
  /** Replaces the default heading, e.g. with one that names a service. */
  heading?: string;
};

/**
 * Closing contact section, on the home page and every service page. Carries
 * `id="contact"`, the target of every "Start a project" CTA. The intro holds
 * its place while the form sits beside it on wide screens.
 */
export function Contact({ heading = contact.heading }: ContactProps) {
  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      <div className={`container grid ${styles.inner}`}>
        <div className={styles.intro}>
          <SectionLabel>{contact.label}</SectionLabel>
          <h2 id="contact-title" className={styles.heading}>
            {heading}
          </h2>
          <p className={styles.supporting}>{contact.supporting}</p>
        </div>

        <div className={styles.formWrap}>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
