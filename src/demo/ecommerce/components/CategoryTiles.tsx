import Link from "next/link";

import { demoRoutes } from "../brand";
import type { Category } from "../data/types";
import styles from "./CategoryTiles.module.css";
import { Media } from "./Media";

const TILE_SIZES = "(min-width: 90rem) 22rem, (min-width: 40rem) 25vw, 50vw";

export function CategoryTiles({ categories }: { categories: readonly Category[] }) {
  return (
    <ul className={styles.tiles}>
      {categories.map((category) => (
        <li key={category.slug} className={styles.tile}>
          <Media image={category.image} sizes={TILE_SIZES} decorative />
          <Link href={demoRoutes.category(category.slug)} className={styles.link}>
            {category.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
