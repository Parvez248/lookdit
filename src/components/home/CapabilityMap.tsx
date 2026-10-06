import type { CSSProperties } from "react";

import type { CapabilityMap as CapabilityMapContent } from "@/content/work";

import styles from "./CapabilityMap.module.css";

type CapabilityMapProps = {
  map: CapabilityMapContent;
};

const pad = (position: number) => String(position).padStart(2, "0");

/**
 * The temporary project visual: the journey's stages as columns, and each core service
 * as a dimension line across the stages it applies to. Each span is also written out in
 * words, so the meaning never depends on reading the geometry. Replaced by the concept's
 * real screens once they exist.
 */
export function CapabilityMap({ map }: CapabilityMapProps) {
  const stageName = (position: number) => map.stages[position - 1];

  return (
    <figure className={styles.map}>
      <p className={styles.label}>{map.label}</p>
      <div className={styles.plate}>
        <ol className={styles.stages}>
          {map.stages.map((stage, index) => (
            <li key={stage} className={styles.stage}>
              <span className={styles.index} aria-hidden="true">
                {pad(index + 1)}
              </span>
              {stage}
            </li>
          ))}
        </ol>

        <div className={styles.chart}>
          {/* Column numbers for the small-screen ruler, where the stage names sit above. */}
          <div className={styles.ticks} aria-hidden="true">
            {map.stages.map((stage, index) => (
              <span key={stage}>{pad(index + 1)}</span>
            ))}
          </div>

          <dl className={styles.spans}>
            {map.spans.map((span) => (
              <div
                key={span.capability}
                className={styles.span}
                // Grid lines for the span (end is exclusive). React's CSSProperties has no
                // index signature for custom properties, hence the cast.
                style={{ "--start": span.from, "--end": span.to + 1 } as CSSProperties}
              >
                <dt className={styles.capability}>{span.capability}</dt>
                <dd className={styles.range}>
                  {stageName(span.from)} to {stageName(span.to)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <figcaption className={styles.caption}>{map.caption}</figcaption>
    </figure>
  );
}
