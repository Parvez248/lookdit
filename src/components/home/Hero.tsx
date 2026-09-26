import { ButtonLink } from "@/components/ui/ButtonLink";
import { FocusFrame } from "@/components/ui/FocusFrame";
import { contactCta, hero } from "@/content/site";

import styles from "./Hero.module.css";

/** Enough column lines for the widest grid; CSS hides the extras per breakpoint. */
const GRID_LINES = Array.from({ length: 12 }, (_, index) => index);

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.gridLines} aria-hidden="true">
        <div className="container grid">
          {GRID_LINES.map((line) => (
            <span key={line} />
          ))}
        </div>
      </div>

      <div className={`container ${styles.inner}`}>
        <p className={styles.eyebrow}>{hero.eyebrow}</p>

        <div className={`grid ${styles.titleRow}`}>
          <h1 id="hero-title" className={styles.title}>
            {hero.headlineLead}{" "}
            <FocusFrame intro className={styles.focus}>
              {hero.headlineFocus}
            </FocusFrame>
          </h1>
        </div>

        <div className={`grid ${styles.lower}`}>
          <p className={styles.supporting}>{hero.supporting}</p>
          <div className={styles.actions}>
            <ButtonLink href={contactCta.href}>{contactCta.label}</ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} variant="quiet">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>

        <div className={`grid ${styles.band}`}>
          <p className={styles.bandLabel} id="hero-disciplines">
            Disciplines
          </p>
          <ol className={styles.disciplines} aria-labelledby="hero-disciplines">
            {hero.disciplines.map((discipline, index) => (
              <li key={discipline}>
                <span className={styles.index} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {discipline}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
