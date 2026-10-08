import Link from "next/link";

import { portalRoutes } from "@/lib/portal/routes";

import styles from "./not-found.module.css";

/** Also what a client sees for a project that isn't theirs: the same page as a missing one. */
export default function PortalNotFound() {
  return (
    <div className={`container ${styles.page}`}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>This page doesn’t exist.</h1>
      <p className={styles.body}>The link may be wrong, or the project is no longer shared here.</p>
      <Link href={portalRoutes.home} className={styles.link}>
        Back to your projects
      </Link>
    </div>
  );
}
