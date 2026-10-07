import type { Product } from "../data/types";
import styles from "./ProductDetails.module.css";

/** Everything visible and in the HTML: no accordions hiding copy. */
export function ProductDetails({ product }: { product: Product }) {
  const { materials, dimensions, care } = product.details;

  return (
    <div className={styles.details}>
      <section aria-labelledby="description-heading">
        <h2 id="description-heading" className={styles.heading}>
          Description
        </h2>
        <p className={styles.description}>{product.description}</p>
      </section>

      <section aria-labelledby="details-heading">
        <h2 id="details-heading" className={styles.heading}>
          Details
        </h2>
        <dl className={styles.list}>
          <div className={styles.row}>
            <dt>Materials</dt>
            <dd>{materials}</dd>
          </div>
          <div className={styles.row}>
            <dt>Dimensions</dt>
            <dd>{dimensions}</dd>
          </div>
          <div className={styles.row}>
            <dt>Care</dt>
            <dd>{care}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
