import Link from "next/link";

import { portalSignOut } from "@/app/actions/portal-auth";
import { Brand } from "@/components/site/Brand";
import { portalRoutes } from "@/lib/portal/routes";

import styles from "./PortalHeader.module.css";

type PortalHeaderProps = {
  /** The signed-in person. */
  name: string;
  /** Their organisation, shown beside the name when there is one. */
  organisation: string | null;
};

/** The signed-in portal shell's header: brand, who is signed in, and Sign out. No section nav yet. */
export function PortalHeader({ name, organisation }: PortalHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.identity}>
          <Link href={portalRoutes.home} className={styles.home} aria-label="LOOKDIT Client portal, your projects">
            <Brand height={32} />
          </Link>
          <span className={styles.tag} aria-hidden="true">
            Client portal
          </span>
        </div>

        <div className={styles.account}>
          <p className={styles.user}>
            <span className="visually-hidden">Signed in as </span>
            <span className={styles.name}>{name}</span>
            {organisation ? <span className={styles.org}>{organisation}</span> : null}
          </p>
          <form action={portalSignOut}>
            <button type="submit" className={styles.signOut}>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
