import styles from "./ScreenPlaceholder.module.css";

/**
 * A clearly labelled stand-in for a screenshot that doesn't exist yet. It
 * reserves a 16:10 frame (so swapping in the real image won't shift layout)
 * and says what will go there.
 */
export function ScreenPlaceholder({ title, caption }: { title: string; caption: string }) {
  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <span className={styles.tag}>Image placeholder</span>
        <span className={styles.title}>{title}</span>
        <span className={styles.note}>Demo screenshot to come</span>
      </div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}
