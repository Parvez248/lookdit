import Image from "next/image";

import styles from "./Brand.module.css";

/** Intrinsic size of public/brand/lookdit-logo.png. */
const LOGO_WIDTH = 449;
const LOGO_HEIGHT = 465;

type BrandProps = {
  /** Rendered height of the mark in px; the width follows the logo's aspect ratio. */
  height?: number;
};

/**
 * The supplied LOOKDIT mark with the name set beside it (never on it). The mark
 * is used exactly as supplied: no recolouring, effects or stretching. Its alt is
 * empty because the adjacent "LOOKDIT" text already names it, so screen readers
 * don't hear the name twice.
 */
export function Brand({ height = 36 }: BrandProps) {
  const width = Math.round((height * LOGO_WIDTH) / LOGO_HEIGHT);

  return (
    <span className={styles.brand}>
      <Image
        src="/brand/lookdit-logo.png"
        alt=""
        width={width}
        height={height}
        loading="eager"
        className={styles.mark}
        style={{ height, width: "auto" }}
      />
      <span className={styles.name}>LOOKDIT</span>
    </span>
  );
}
