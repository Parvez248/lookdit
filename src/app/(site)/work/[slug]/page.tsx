import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { getPublishedProjectBySlug } from "@/db/queries/projects";
import { PROJECT_CATEGORY_LABELS, type ProjectCategory } from "@/lib/projects/status";

import styles from "./page.module.css";

// Detail reads a single published project at request time (draft/archived 404).
export const dynamic = "force-dynamic";

function categoryLabel(category: string): string {
  return PROJECT_CATEGORY_LABELS[category as ProjectCategory] ?? category;
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

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title: `${title} — LOOKDIT`, description, url: canonical, type: "article" },
  };
}

export default async function WorkDetailPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (project === null) notFound();

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
      </div>
    </article>
  );
}
