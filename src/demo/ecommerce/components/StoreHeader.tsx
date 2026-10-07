import Link from "next/link";

import { brand, demoRoutes } from "../brand";
import { storeNav } from "../navigation";
import styles from "./StoreHeader.module.css";
import { StoreMenu } from "./StoreMenu";

export function StoreHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link href={demoRoutes.home} className={styles.wordmark}>
          {brand.name}
        </Link>

        <nav aria-label="Main" className={styles.nav}>
          <ul className={styles.links}>
            {storeNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.menu}>
          <StoreMenu items={storeNav} brandName={brand.name} homeHref={demoRoutes.home} />
        </div>
      </div>
    </header>
  );
}
