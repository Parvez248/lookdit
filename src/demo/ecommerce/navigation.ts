import { demoRoutes } from "./brand";
import { categories } from "./data/categories";

export type StoreNavItem = { label: string; href: string };

/** Primary store navigation: the whole shop, then each category section. */
export const storeNav: readonly StoreNavItem[] = [
  { label: "Shop all", href: demoRoutes.shop },
  ...categories.map((category) => ({ label: category.name, href: demoRoutes.category(category.slug) })),
];
