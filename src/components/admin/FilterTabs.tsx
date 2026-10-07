import Link from "next/link";

import styles from "./FilterTabs.module.css";

type FilterTab = {
  label: string;
  href: string;
  count: number;
  current: boolean;
};

/** Status filters for an admin list: links with counts, the current one marked. */
export function FilterTabs({ label, tabs }: { label: string; tabs: FilterTab[] }) {
  return (
    <nav aria-label={label} className={styles.filters}>
      <ul className={styles.list}>
        {tabs.map((tab) => (
          <li key={tab.label}>
            <Link href={tab.href} className={styles.tab} aria-current={tab.current ? "page" : undefined}>
              {tab.label}
              <span className={styles.count}>{tab.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
