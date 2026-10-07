"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNav, adminRoutes } from "@/lib/auth/routes";

import styles from "./AdminNav.module.css";

/** Client only to read the current path for `aria-current`. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className={styles.nav}>
      <ul className={styles.list}>
        {adminNav.map((item) => {
          // Dashboard matches exactly; sections also match their sub-pages.
          const current =
            item.href === adminRoutes.home ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} className={styles.link} aria-current={current ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
