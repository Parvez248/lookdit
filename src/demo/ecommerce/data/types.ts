import type { StaticImageData } from "next/image";

/** Prices in integer minor units (4800 = €48.00), so totals never meet floating point. */
export type Money = { amount: number; currency: "EUR" };

export type CategorySlug = "tableware" | "textiles" | "lighting" | "objects";

export type Category = {
  slug: CategorySlug;
  name: string;
  /** Unique copy for the category's section on the shop page. */
  description: string;
  /** The category's tile on the storefront. */
  image: DemoImage;
};

export type ImageRatio = "4/5" | "16/9";

/**
 * One planned image. `src` stays empty until the approved asset exists; until then the
 * page renders a placeholder plate of exactly the same ratio, so swapping the asset in
 * is a data change that cannot move the layout.
 */
export type DemoImage = {
  /** Stable id; also names the eventual file. */
  id: string;
  alt: string;
  ratio: ImageRatio;
  kind: "packshot" | "detail" | "context" | "hero";
  src?: StaticImageData;
};

export type OptionValue = {
  id: string;
  label: string;
  /** Decorative chip colour; the text label always carries the meaning. */
  swatch?: string;
  /** Only when a real image of this colourway exists. Selecting the value shows it. */
  image?: DemoImage;
};

export type ProductOption = {
  name: "Colour" | "Size";
  values: readonly [OptionValue, ...OptionValue[]];
};

export type Product = {
  slug: string;
  title: string;
  category: CategorySlug;
  /** One sentence: cards and the PDP intro. */
  summary: string;
  /** Product descriptions are kept roughly within 50–120 words for consistent editorial rhythm. */
  description: string;
  details: { materials: string; dimensions: string; care: string };
  price: Money;
  label?: "New" | "Seasonal";
  /** First image: card and PDP primary. Colourway images live on their option values. */
  images: readonly [DemoImage, ...DemoImage[]];
  options?: readonly ProductOption[];
  /** Unique, at most 160 characters. */
  metaDescription: string;
};
