import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { demoRoutes } from "@/demo/ecommerce/brand";
import { Breadcrumbs } from "@/demo/ecommerce/components/Breadcrumbs";
import { ProductDetails } from "@/demo/ecommerce/components/ProductDetails";
import { ProductGallery } from "@/demo/ecommerce/components/ProductGallery";
import { ProductGrid } from "@/demo/ecommerce/components/ProductGrid";
import { ProductOptions } from "@/demo/ecommerce/components/ProductOptions";
import { formatPrice, getCategory, getProduct, products, relatedProducts } from "@/demo/ecommerce/data/catalog";

import styles from "./page.module.css";

// Every product page is built at build time. With dynamicParams off, any other slug is a
// plain 404 instead of an on-demand render, so random URLs never grow the cache.
export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/demo/ecommerce/product/[slug]">): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  return { title: product.title, description: product.metaDescription };
}

export default async function ProductPage({ params }: PageProps<"/demo/ecommerce/product/[slug]">) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const related = relatedProducts(product);

  // Structured data: deliberately none. These products are fictional and the demo is noindex.
  // In a real store, Product JSON-LD would be rendered here, from this same product record so
  // it can never disagree with the page: Product (name, description, image, sku/gtin, brand),
  // Offer (price and priceCurrency from the live price source, availability from real
  // inventory), AggregateRating/Review only when genuine reviews are on the page, and a
  // BreadcrumbList mirroring the breadcrumb below. Validate with the Rich Results Test.

  return (
    <div className="container">
      <div className={styles.crumbs}>
        <Breadcrumbs
          trail={[
            { label: "Shop", href: demoRoutes.shop },
            { label: category.name, href: demoRoutes.category(category.slug) },
          ]}
          current={product.title}
        />
      </div>

      <article className={`grid ${styles.product}`} aria-labelledby="product-title">
        <div className={styles.gallery}>
          <ProductGallery product={product} />
        </div>

        <div className={styles.info}>
          {product.label && <p className={styles.label}>{product.label}</p>}
          <h1 id="product-title" className={styles.title}>
            {product.title}
          </h1>
          <p className={styles.price}>{formatPrice(product.price)}</p>
          <p className={styles.summary}>{product.summary}</p>
          <ProductOptions options={product.options ?? []} />
        </div>

        <div className={styles.details}>
          <ProductDetails product={product} />
        </div>
      </article>

      {related.length > 0 && (
        <section className={styles.related} aria-labelledby="related-heading">
          <h2 id="related-heading" className={styles.relatedTitle}>
            More from {category.name}
          </h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
