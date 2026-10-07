import Link from "next/link";

import { demoRoutes } from "../brand";
import { colourCount, formatPrice } from "../data/catalog";
import type { Product } from "../data/types";
import { Media } from "./Media";
import styles from "./ProductCard.module.css";

/** Matches ProductGrid's columns: 2, then 3 from 40rem, then 4 from 64rem, capped at 90rem. */
const CARD_SIZES = "(min-width: 90rem) 22rem, (min-width: 64rem) 25vw, (min-width: 40rem) 33vw, 50vw";

/**
 * The title link is stretched over the whole card, so the card is one click target and one
 * tab stop whose accessible name is just the product title.
 */
export function ProductCard({ product }: { product: Product }) {
  const colours = colourCount(product);

  return (
    <article className={styles.card}>
      <Media image={product.images[0]} sizes={CARD_SIZES} decorative className={styles.media} />
      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link href={demoRoutes.product(product.slug)} className={styles.link}>
            {product.title}
          </Link>
        </h3>
        <p className={styles.price}>{formatPrice(product.price)}</p>
        {(product.label || colours) && (
          <p className={styles.meta}>
            {product.label && <span className={styles.label}>{product.label}</span>}
            {colours && <span>{colours}</span>}
          </p>
        )}
      </div>
    </article>
  );
}
