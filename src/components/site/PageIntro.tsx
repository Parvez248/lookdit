import type { ReactNode } from "react";

import { SectionLabel } from "@/components/ui/SectionLabel";

import styles from "./PageIntro.module.css";

type PageIntroProps = {
  label: ReactNode;
  title: ReactNode;
  /** The h1's id, for the page landmark's aria-labelledby. */
  titleId: string;
  lead?: ReactNode;
  /** Optional row of ButtonLinks under the lead. */
  actions?: ReactNode;
};

/** The opening block of an inner page: label, h1, lead and actions. */
export function PageIntro({ label, title, titleId, lead, actions }: PageIntroProps) {
  return (
    <header className={styles.intro}>
      <SectionLabel>{label}</SectionLabel>
      <h1 id={titleId} className={styles.title}>
        {title}
      </h1>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
