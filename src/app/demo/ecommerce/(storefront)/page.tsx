import Link from "next/link";

import { brand, demoRoutes } from "@/demo/ecommerce/brand";
import { CategoryTiles } from "@/demo/ecommerce/components/CategoryTiles";
import { Media } from "@/demo/ecommerce/components/Media";
import { ProductGrid } from "@/demo/ecommerce/components/ProductGrid";
import { categories, featuredProducts } from "@/demo/ecommerce/data/catalog";
import { heroImage, scenes } from "@/demo/ecommerce/data/media";

import styles from "./page.module.css";

// Uses the root layout's default title and description.

export default function StorefrontPage() {
  return (
    <>
      <section className={`container grid ${styles.hero}`} aria-labelledby="hero-heading">
        <div className={styles.heroMedia}>
          <Media
            image={heroImage}
            fit="parent"
            sizes="(min-width: 90rem) 60rem, (min-width: 64rem) 66vw, 100vw"
            priority
          />
        </div>
        <div className={styles.heroText}>
          <h1 id="hero-heading" className={styles.heroTitle}>
            {brand.tagline}
          </h1>
          <p className={styles.heroIntro}>
            Tableware, textiles, lighting and small objects in a quiet, warm palette, made for
            the rooms you use every day.
          </p>
          <Link href={demoRoutes.shop} className={styles.cta}>
            Shop the collection
          </Link>
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="categories-heading">
        <h2 id="categories-heading" className={styles.sectionTitle}>
          Shop by category
        </h2>
        <CategoryTiles categories={categories} />
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="new-heading">
        <div className={styles.sectionHead}>
          <h2 id="new-heading" className={styles.sectionTitle}>
            New this season
          </h2>
          <Link href={demoRoutes.shop} className={styles.textLink}>
            Shop all
          </Link>
        </div>
        <ProductGrid products={featuredProducts()} />
      </section>

      <section className={`container grid ${styles.section} ${styles.story}`} aria-labelledby="story-heading">
        <div className={styles.storyMedia}>
          <Media image={scenes.glazeDetail} sizes="(min-width: 90rem) 40rem, (min-width: 64rem) 45vw, 100vw" />
        </div>
        <div className={styles.storyText}>
          <h2 id="story-heading" className={styles.sectionTitle}>
            Chosen for use
          </h2>
          <p>
            {brand.name} keeps to a short list of materials: stoneware, linen, cotton, oak, paper
            and brass. The collection stays close to their texture, weight and colour, with
            pieces designed around everyday use.
          </p>
          <p>
            Colours stay close to the materials themselves, so a mug, a throw and a tray can share
            a room without looking like a set. The pieces are meant to be used daily, washed often
            and kept.
          </p>
        </div>
      </section>
    </>
  );
}
