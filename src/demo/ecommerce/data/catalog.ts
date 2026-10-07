import { categories as categoryFixtures } from "./categories";
import { products as productFixtures } from "./products";
import type { Category, CategorySlug, DemoImage, Money, Product } from "./types";

// Read helpers over the static fixtures. Everything here runs at build time in Server
// Components; with 12 products, plain array scans are clearer than an index and cost nothing.

/** The fixtures widened to their declared types (the literal `as const` types are too narrow). */
export const categories: readonly Category[] = categoryFixtures;
export const products: readonly Product[] = productFixtures;

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getCategory(slug: CategorySlug): Category {
  const category = categories.find((c) => c.slug === slug);
  // Unreachable while the fixtures type-check: CategorySlug is a closed union and the tests
  // assert every slug has a category.
  if (!category) throw new Error(`Unknown category: ${slug}`);
  return category;
}

export function productsInCategory(slug: CategorySlug): Product[] {
  return products.filter((product) => product.category === slug);
}

/** The storefront's "New this season" row. */
export function featuredProducts(): Product[] {
  return products.filter((product) => product.label === "New");
}

/** Other products from the same category, in catalogue order. Never includes `product`. */
export function relatedProducts(product: Product, limit = 4): Product[] {
  return productsInCategory(product.category)
    .filter((other) => other.slug !== product.slug)
    .slice(0, limit);
}

/** "2 colours" for cards; undefined when the product has a single colour. */
export function colourCount(product: Product): string | undefined {
  const colour = product.options?.find((option) => option.name === "Colour");
  return colour && colour.values.length > 1 ? `${colour.values.length} colours` : undefined;
}

/**
 * The images in the gallery's first slot: one per colourway when the product's colour option
 * has images, otherwise the primary image. Index 0 always matches the default selection.
 */
export function primaryImages(product: Product): { image: DemoImage; colourway?: number }[] {
  const colour = product.options?.find((option) => option.name === "Colour");
  const withImages = colour?.values.flatMap((value, index) =>
    value.image ? [{ image: value.image, colourway: index + 1 }] : [],
  );
  return withImages && withImages.length > 0 ? withImages : [{ image: product.images[0] }];
}

/** The rest of the gallery: every product image not already shown in the first slot. */
export function secondaryImages(product: Product): DemoImage[] {
  const shown = new Set(primaryImages(product).map(({ image }) => image.id));
  return product.images.filter((image) => !shown.has(image.id));
}

const eurFormat = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" });

/** €24.00. Amounts are integer cents. */
export function formatPrice(money: Money): string {
  return eurFormat.format(money.amount / 100);
}
