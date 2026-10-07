import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/admin/SignInForm";
import { Brand } from "@/components/site/Brand";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { adminRoutes } from "@/lib/auth/routes";
import { getCurrentUser } from "@/lib/auth/session";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage() {
  if ((await getCurrentUser()) !== null) redirect(adminRoutes.home);

  return (
    <main id="main" className={styles.page}>
      <div className={styles.column}>
        <Link href="/" className={styles.home} aria-label="LOOKDIT, home">
          <Brand height={32} />
        </Link>

        <section className={styles.panel} aria-labelledby="sign-in-title">
          <span className={styles.corners} aria-hidden="true" />
          <SectionLabel>Admin</SectionLabel>
          <h1 id="sign-in-title" className={styles.title}>
            Sign in
          </h1>
          <p className={styles.lede}>For the LOOKDIT team. Accounts are set up by an administrator.</p>
          <SignInForm />
        </section>
      </div>
    </main>
  );
}
