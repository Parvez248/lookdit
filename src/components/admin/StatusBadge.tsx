import { INQUIRY_STATUS_LABELS, type InquiryStatus } from "@/lib/inquiries/status";

import styles from "./StatusBadge.module.css";

/** An inquiry status as a small mono label with a marker. The text carries the meaning. */
export function StatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span className={styles.badge} data-status={status}>
      {INQUIRY_STATUS_LABELS[status]}
    </span>
  );
}
