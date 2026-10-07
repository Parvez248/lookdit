// The fictional brand behind the E-commerce Experience concept demo.
// Nidery is a LOOKDIT concept: the brand, products, prices and data are fictional.
// The name was chosen for this portfolio demo only; it is not a cleared trademark.

export const brand = {
  name: "Nidery",
  tagline: "Objects for the everyday home.",
  about:
    "Nidery is a fictional home brand: tableware, textiles, lighting and small objects in a quiet palette.",
} as const;

/** Locked wording. Shown on every demo page; never edit without approval. */
export const demoDisclosure = "LOOKDIT concept demo — fictional products and data. Nothing is for sale.";

/** Every demo URL lives under this prefix. */
export const demoBase = "/demo/ecommerce";

export const demoRoutes = {
  home: demoBase,
  shop: `${demoBase}/shop`,
  category: (slug: string) => `${demoBase}/shop#${slug}`,
  product: (slug: string) => `${demoBase}/product/${slug}`,
} as const;
