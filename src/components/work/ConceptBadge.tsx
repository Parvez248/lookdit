import { conceptDisclosure } from "@/content/work";

import styles from "./ConceptBadge.module.css";

/** The concept label. Rendered wherever a concept appears, so it can never be left out. */
export function ConceptBadge({ className }: { className?: string }) {
  return <p className={className ? `${styles.badge} ${className}` : styles.badge}>{conceptDisclosure}</p>;
}
