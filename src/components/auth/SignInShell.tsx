import Link from "next/link";
import type { ReactNode } from "react";

import { Brand } from "@/components/site/Brand";
import { SectionLabel } from "@/components/ui/SectionLabel";

import styles from "./SignInShell.module.css";

type SignInShellProps = {
  /** The kicker above the title: which side of LOOKDIT this sign-in is for. */
  label: string;
  lede: string;
  /** Optional line under the panel. */
  note?: string;
  children: ReactNode;
};

/** The sign-in page frame shared by the admin and the client portal: brand, then one framed panel. */
export function SignInShell({ label, lede, note, children }: SignInShellProps) {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.column}>
        <Link href="/" className={styles.home} aria-label="LOOKDIT, home">
          <Brand height={32} />
        </Link>

        <section className={styles.panel} aria-labelledby="sign-in-title">
          <span className={styles.corners} aria-hidden="true" />
          <SectionLabel>{label}</SectionLabel>
          <h1 id="sign-in-title" className={styles.title}>
            Sign in
          </h1>
          <p className={styles.lede}>{lede}</p>
          {children}
        </section>

        {note ? <p className={styles.note}>{note}</p> : null}
      </div>
    </main>
  );
}
