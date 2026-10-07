import { CLIENT_STATUS_LABELS, type ClientStatus } from "@/lib/clients/status";
import { INQUIRY_STATUS_LABELS, type InquiryStatus } from "@/lib/inquiries/status";
import { WORK_STATUS_LABELS, type WorkStatus } from "@/lib/projects/status";

import styles from "./StatusBadge.module.css";

/** `action` (blue) marks what needs attention; the others only tell statuses apart. */
type Tone = "action" | "signal" | "strong" | "neutral" | "outline";

const inquiryTones: Record<InquiryStatus, Tone> = {
  new: "action",
  reviewing: "signal",
  replied: "strong",
  closed: "neutral",
  spam: "outline",
};

const clientTones: Record<ClientStatus, Tone> = {
  lead: "action",
  active: "signal",
  past: "neutral",
};

const projectTones: Record<WorkStatus, Tone> = {
  active: "action",
  planned: "signal",
  on_hold: "strong",
  completed: "neutral",
  cancelled: "outline",
};

/** A status as a small mono label with a marker. The text carries the meaning. */
function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: InquiryStatus }) {
  return <Badge label={INQUIRY_STATUS_LABELS[status]} tone={inquiryTones[status]} />;
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <Badge label={CLIENT_STATUS_LABELS[status]} tone={clientTones[status]} />;
}

export function ProjectStatusBadge({ status }: { status: WorkStatus }) {
  return <Badge label={WORK_STATUS_LABELS[status]} tone={projectTones[status]} />;
}
