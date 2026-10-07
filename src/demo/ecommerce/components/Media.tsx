import Image from "next/image";

import type { DemoImage, ImageRatio } from "../data/types";
import styles from "./Media.module.css";

/** Planned source size per ratio (2400px long edge), shown on placeholders. */
const plannedSize: Record<ImageRatio, string> = {
  "4/5": "1920 × 2400",
  "16/9": "2400 × 1350",
};

type MediaProps = {
  image: DemoImage;
  /** The `sizes` attribute: how wide the image renders at each breakpoint. */
  sizes: string;
  /**
   * "ratio" (default) reserves the image's own aspect ratio. "parent" fills a box the
   * parent sizes, for art-directed crops such as the hero.
   */
  fit?: "ratio" | "parent";
  /** For images whose meaning is already in adjacent text (card and tile links). */
  decorative?: boolean;
  /** Only for the page's LCP image. */
  priority?: boolean;
  className?: string;
};

/**
 * Renders a demo image. Until the approved asset exists (`image.src` empty) it renders a
 * placeholder plate of exactly the same ratio, so swapping the asset in cannot move layout.
 */
export function Media({ image, sizes, fit = "ratio", decorative = false, priority = false, className }: MediaProps) {
  const frameClass = [styles.frame, fit === "parent" ? styles.fill : styles.ratio, className]
    .filter(Boolean)
    .join(" ");
  const ratioStyle = fit === "ratio" ? { aspectRatio: image.ratio } : undefined;

  if (image.src) {
    return (
      <div className={frameClass} style={ratioStyle}>
        <Image
          src={image.src}
          alt={decorative ? "" : image.alt}
          fill
          sizes={sizes}
          className={styles.image}
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
        />
      </div>
    );
  }

  const a11y = decorative ? { "aria-hidden": true } : { role: "img", "aria-label": image.alt };

  return (
    <div className={`${frameClass} ${styles.placeholder}`} style={ratioStyle} {...a11y}>
      <span className={styles.label} aria-hidden="true">
        Placeholder · {image.kind} {image.ratio.replace("/", ":")}
        <br />
        {image.id} · {plannedSize[image.ratio]}
      </span>
    </div>
  );
}
