import Link from "next/link";

import { adminRoutes } from "@/lib/auth/routes";

import styles from "./not-found.module.css";

export default function AdminNotFound() {
  return (
    <div className={`container ${styles.page}`}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>This page doesn’t exist.</h1>
      <p className={styles.body}>It may have been removed, or the link is wrong.</p>
      <Link href={adminRoutes.home} className={styles.link}>
        Back to the dashboard
      </Link>
    </div>
  );
}
