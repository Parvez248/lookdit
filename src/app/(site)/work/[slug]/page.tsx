import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { MediaImage } from "@/components/work/MediaImage";
import { getPublishedProjectBySlug, type ProjectMediaItem } from "@/db/queries/projects";
import { mediaUrl } from "@/lib/media/url";
import { PROJECT_CATEGORY_LABELS, type ProjectCategory } from "@/lib/projects/status";

import styles from "./page.module.css";

// Detail reads a single published project at request time (draft/archived 404).
export const dynamic = "force-dynamic";

function categoryLabel(category: string): string {
  return PROJECT_CATEGORY_LABELS[category as ProjectCategory] ?? category;
}

type ResolvedImage = ProjectMediaItem & { src: string };

/** Images that resolve to a loadable URL, split into the hero and the gallery (in display order). */
function caseStudyImages(media: ProjectMediaItem[]): { hero: ResolvedImage | null; gallery: ResolvedImage[] } {
  const images = media.flatMap((item) => {
    const src = item.kind === "image" ? mediaUrl(item.storageKey) : null;
    return src ? [{ ...item, src }] : [];
  });
  return {
    hero: images.find((item) => item.role === "hero") ?? null,
    gallery: images.filter((item) => item.role === "gallery"),
  };
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (project === null) return { title: "Work" };

  const title = project.seoTitle ?? project.title;
  const description = project.seoDescription ?? project.summary;
  const canonical = `/work/${project.slug}`;
  const { hero } = caseStudyImages(project.media);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} — LOOKDIT`,
      description,
      siteName: "LOOKDIT",
      url: canonical,
      type: "article",
      ...(hero
        ? {
            images: [
              { url: hero.src, alt: hero.alt ?? "", ...(hero.width && hero.height ? { width: hero.width, height: hero.height } : {}) },
            ],
          }
        : {}),
    },
  };
}

export default async function WorkDetailPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (project === null) notFound();
  const { hero, gallery } = caseStudyImages(project.media);

  return (
    <article className={styles.section} aria-labelledby="case-title">
      <div className={`container ${styles.inner}`}>
        <Link href="/work" className={styles.back}>
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.backIcon}>
            <path d="M13 8H3.5M7.5 4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          All work
        </Link>

        <header className={styles.header}>
          <SectionLabel>{categoryLabel(project.category)}</SectionLabel>
          <h1 id="case-title" className={styles.title}>
            {project.title}
          </h1>
          <p className={styles.summary}>{project.summary}</p>
        </header>

        {hero ? (
          <figure className={styles.hero}>
            <MediaImage
              src={hero.src}
              alt={hero.alt ?? ""}
              width={hero.width}
              height={hero.height}
              sizes="(min-width: 98rem) 90rem, 100vw"
              preload
            />
          </figure>
        ) : null}

        <div className={styles.layout}>
          <div className={styles.body}>
            {project.metrics && project.metrics.length > 0 ? (
              <dl className={styles.metrics}>
                {project.metrics.map((metric) => (
                  <div key={`${metric.label}-${metric.value}`} className={styles.metric}>
                    <dt className={styles.metricValue}>{metric.value}</dt>
                    <dd className={styles.metricLabel}>{metric.label}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {project.liveUrl ? (
              <a href={project.liveUrl} target="_blank" rel="noreferrer" className={styles.live}>
                Visit the live site
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.liveIcon}>
                  <path d="M6 3h7v7M13 3 4 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </a>
            ) : null}
          </div>

          <aside className={styles.side} aria-label="Project details">
            <dl className={styles.facts}>
              {project.client ? (
                <div>
                  <dt>Client</dt>
                  <dd>{project.client}</dd>
                </div>
              ) : null}
              <div>
                <dt>Category</dt>
                <dd>{categoryLabel(project.category)}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{project.year}</dd>
              </div>
            </dl>

            {project.technologies.length > 0 ? (
              <div className={styles.tech}>
                <p className={styles.techLabel}>Built with</p>
                <ul className={styles.techList}>
                  {project.technologies.map((tech) => (
                    <li key={tech.id} className={styles.techItem}>
                      {tech.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>

        {gallery.length > 0 ? (
          <section aria-label="Project images" className={styles.gallery}>
            <ul className={styles.galleryList}>
              {gallery.map((image) => (
                <li key={image.id}>
                  <MediaImage
                    src={image.src}
                    alt={image.alt ?? ""}
                    width={image.width}
                    height={image.height}
                    sizes="(min-width: 98rem) 90rem, 100vw"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
