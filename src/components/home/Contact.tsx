import { SectionLabel } from "@/components/ui/SectionLabel";
import { contact } from "@/content/site";

import { ContactForm } from "./ContactForm";
import styles from "./Contact.module.css";

/**
 * Closing contact section. Carries `id="contact"`, the target of every
 * "Start a project" CTA (header, hero, footer). The intro holds its place while
 * the form sits beside it on wide screens.
 */
export function Contact() {
  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      <div className={`container grid ${styles.inner}`}>
        <div className={styles.intro}>
          <SectionLabel>{contact.label}</SectionLabel>
          <h2 id="contact-title" className={styles.heading}>
            {contact.heading}
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
