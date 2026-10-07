import { describe, expect, it } from "vitest";

import {
  categories,
  colourCount,
  featuredProducts,
  formatPrice,
  getProduct,
  primaryImages,
  products,
  productsInCategory,
  relatedProducts,
  secondaryImages,
} from "./catalog";
import { heroImage } from "./media";
import type { DemoImage, Product } from "./types";

const allProducts = products;

function allImages(product: Product): DemoImage[] {
  const optionImages = (product.options ?? []).flatMap((option) =>
    option.values.flatMap((value) => (value.image ? [value.image] : [])),
  );
  return [...product.images, ...optionImages];
}

describe("catalog fixtures", () => {
  it("has 12 products in 4 categories, each category in use", () => {
    expect(allProducts).toHaveLength(12);
    expect(categories).toHaveLength(4);
    for (const category of categories) {
      expect(productsInCategory(category.slug).length).toBeGreaterThan(0);
    }
  });

  it("uses unique, URL-safe slugs", () => {
    const slugs = allProducts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("prices every product as a positive whole number of cents in EUR", () => {
    for (const p of allProducts) {
      expect(Number.isInteger(p.price.amount)).toBe(true);
      expect(p.price.amount).toBeGreaterThan(0);
      expect(p.price.currency).toBe("EUR");
    }
  });

  it("only uses the approved labels", () => {
    for (const p of allProducts) {
      if (p.label !== undefined) expect(["New", "Seasonal"]).toContain(p.label);
    }
  });

  it("gives every image alt text and a stable id", () => {
    const images = [heroImage, ...categories.map((c) => c.image), ...allProducts.flatMap(allImages)];
    for (const image of images) {
      expect(image.alt.trim().length).toBeGreaterThan(10);
      expect(image.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("stays within the approved asset plan of 22 images", () => {
    const ids = new Set(
      [heroImage, ...categories.map((c) => c.image), ...allProducts.flatMap(allImages)].map((i) => i.id),
    );
    expect(ids.size).toBe(22);
  });

  it("uses unique option value ids within each option", () => {
    for (const p of allProducts) {
      for (const option of p.options ?? []) {
        const ids = option.values.map((v) => v.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it("gives colour images only to colour options, starting with the primary image", () => {
    for (const p of allProducts) {
      for (const option of p.options ?? []) {
        const imaged = option.values.filter((v) => v.image);
        if (option.name !== "Colour") {
          expect(imaged).toHaveLength(0);
        } else if (imaged.length > 0) {
          // The first radio is checked by default, so its image must be the one shown first.
          expect(option.values[0].image?.id).toBe(p.images[0].id);
        }
      }
    }
  });

  it("has unique meta descriptions of at most 160 characters", () => {
    const metas = allProducts.map((p) => p.metaDescription);
    expect(new Set(metas).size).toBe(metas.length);
    for (const meta of metas) expect(meta.length).toBeLessThanOrEqual(160);
  });

  it("keeps product descriptions between 50 and 120 words", () => {
    for (const p of allProducts) {
      const words = p.description.split(/\s+/).length;
      expect(words, p.slug).toBeGreaterThanOrEqual(50);
      expect(words, p.slug).toBeLessThanOrEqual(120);
    }
  });
});

describe("catalog helpers", () => {
  it("finds products by slug and returns undefined for unknown slugs", () => {
    expect(getProduct("stoneware-mug")?.title).toBe("Stoneware Mug");
    expect(getProduct("not-a-product")).toBeUndefined();
  });

  it("features only products labelled New", () => {
    const featured = featuredProducts();
    expect(featured.length).toBeGreaterThan(0);
    for (const p of featured) expect(p.label).toBe("New");
  });

  it("never relates a product to itself and stays in its category", () => {
    for (const p of allProducts) {
      const related = relatedProducts(p);
      expect(related.map((r) => r.slug)).not.toContain(p.slug);
      for (const r of related) expect(r.category).toBe(p.category);
    }
  });

  it("counts colours only when there is more than one", () => {
    expect(colourCount(getProduct("stoneware-mug")!)).toBe("2 colours");
    expect(colourCount(getProduct("linen-cushion-cover")!)).toBeUndefined();
    expect(colourCount(getProduct("oak-serving-tray")!)).toBeUndefined();
  });

  it("puts one image per colourway in the first gallery slot and never repeats an image", () => {
    const mug = getProduct("stoneware-mug")!;
    expect(primaryImages(mug).map((i) => [i.image.id, i.colourway])).toEqual([
      ["mug-oat", 1],
      ["mug-slate", 2],
    ]);
    expect(secondaryImages(mug).map((i) => i.id)).toEqual(["scene-tableware"]);

    const tray = getProduct("oak-serving-tray")!;
    expect(primaryImages(tray)).toEqual([{ image: tray.images[0] }]);
    expect(secondaryImages(tray).map((i) => i.id)).toEqual(["scene-objects"]);
  });

  it("formats prices in euros from cents", () => {
    expect(formatPrice({ amount: 2400, currency: "EUR" })).toBe("€24.00");
    expect(formatPrice({ amount: 21000, currency: "EUR" })).toBe("€210.00");
    expect(formatPrice({ amount: 1850, currency: "EUR" })).toBe("€18.50");
  });
});
