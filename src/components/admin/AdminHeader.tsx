import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { Brand } from "@/components/site/Brand";
import { adminRoutes } from "@/lib/auth/routes";

import styles from "./AdminHeader.module.css";

type AdminHeaderProps = {
  userName: string;
};

export function AdminHeader({ userName }: AdminHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.identity}>
          <Link href={adminRoutes.home} className={styles.home} aria-label="LOOKDIT Admin, dashboard">
            <Brand height={32} />
          </Link>
          <span className={styles.tag} aria-hidden="true">
            Admin
          </span>
        </div>

        <div className={styles.account}>
          <p className={styles.user}>
            <span className="visually-hidden">Signed in as </span>
            {userName}
          </p>
          <form action={signOut}>
            <button type="submit" className={styles.signOut}>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
