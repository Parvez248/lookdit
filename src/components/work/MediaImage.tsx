import Image from "next/image";

import styles from "./MediaImage.module.css";

type MediaImageProps = {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
  /** The rendered width at each breakpoint, so the browser picks the right file. */
  sizes: string;
  /** Above the fold (the case-study hero): fetch early for LCP. */
  preload?: boolean;
  className?: string;
};

/**
 * A project image that never shifts layout. With known dimensions it reserves
 * the image's own aspect ratio; without them it uses a 16:10 frame and fits the
 * whole image inside, so screenshots are never cropped.
 */
export function MediaImage({ src, alt, width, height, sizes, preload, className }: MediaImageProps) {
  if (width && height) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        preload={preload}
        className={[styles.image, className].filter(Boolean).join(" ")}
      />
    );
  }
  return (
    <span className={[styles.frame, className].filter(Boolean).join(" ")}>
      <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className={styles.contain} />
    </span>
  );
}
