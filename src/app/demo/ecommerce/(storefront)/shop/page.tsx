import type { Metadata } from "next";
import Link from "next/link";

import { brand } from "@/demo/ecommerce/brand";
import { ProductGrid } from "@/demo/ecommerce/components/ProductGrid";
import { categories, products, productsInCategory } from "@/demo/ecommerce/data/catalog";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Shop all",
  description: `All ${products.length} ${brand.name} pieces by category: tableware, textiles, lighting and objects. A LOOKDIT concept demo with fictional products.`,
};

export default function ShopPage() {
  return (
    <div className="container">
      <header className={styles.intro}>
        <h1 className={styles.title}>Shop all</h1>
        <p className={styles.lede}>
          Every {brand.name} piece, by category. <span className={styles.count}>{products.length} objects</span>
        </p>
        <nav aria-label="Categories" className={styles.jump}>
          <ul className={styles.jumpList}>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`#${category.slug}`} className={styles.jumpLink}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {categories.map((category) => (
        <section
          key={category.slug}
          id={category.slug}
          className={styles.category}
          aria-labelledby={`${category.slug}-heading`}
        >
          <div className={styles.categoryHead}>
            <h2 id={`${category.slug}-heading`} className={styles.categoryTitle}>
              {category.name}
            </h2>
            <p className={styles.categoryText}>{category.description}</p>
          </div>
          <ProductGrid products={productsInCategory(category.slug)} />
        </section>
      ))}
    </div>
  );
}
