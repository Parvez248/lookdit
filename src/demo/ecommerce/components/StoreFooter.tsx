import Link from "next/link";

import { brand } from "../brand";
import { storeNav } from "../navigation";
import styles from "./StoreFooter.module.css";

export function StoreFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container grid ${styles.inner}`}>
        <div className={styles.about}>
          <p className={styles.wordmark}>{brand.name}</p>
          <p className={styles.aboutText}>{brand.about}</p>
        </div>

        <nav aria-label="Footer" className={styles.nav}>
          <h2 className={styles.heading}>Shop</h2>
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

        <p className={styles.credit}>
          {/* A different root layout: Next does a full page load here, which is expected. */}
          <Link href="/" className={styles.link}>
            A concept demo by LOOKDIT
          </Link>
        </p>
      </div>
    </footer>
  );
}
