import { primaryImages, secondaryImages } from "../data/catalog";
import type { Product } from "../data/types";
import { Media } from "./Media";
import styles from "./ProductGallery.module.css";

/** Strip slides at 82vw below 64rem; columns 1–7 of the capped container above it. */
const GALLERY_SIZES = "(min-width: 90rem) 52rem, (min-width: 64rem) 56vw, 82vw";

/**
 * A scroll-snap strip on small screens and a stacked column on large ones; CSS only.
 * Colourway images carry `data-colourway`, matched by the radios of the same number in
 * ProductOptions. The PDP's stylesheet shows the image for the checked colour with `:has()`;
 * without `:has()` support every colourway simply stays visible in the gallery.
 */
export function ProductGallery({ product }: { product: Product }) {
  const primary = primaryImages(product);
  const secondary = secondaryImages(product);

  return (
    // A labelled, focusable region so keyboard users can scroll the strip.
    <div role="region" aria-label="Product images" tabIndex={0} className={styles.gallery}>
      <ul className={styles.list}>
        {primary.map(({ image, colourway }, index) => (
          <li key={image.id} className={styles.slide} data-colourway={colourway}>
            <Media image={image} sizes={GALLERY_SIZES} priority={index === 0} />
          </li>
        ))}
        {secondary.map((image) => (
          <li key={image.id} className={styles.slide}>
            <Media image={image} sizes={GALLERY_SIZES} />
          </li>
        ))}
      </ul>
    </div>
  );
}
