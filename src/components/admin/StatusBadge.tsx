import { Badge, type BadgeTone as Tone } from "@/components/ui/Badge";
import { CLIENT_STATUS_LABELS, type ClientStatus } from "@/lib/clients/status";
import { INQUIRY_STATUS_LABELS, type InquiryStatus } from "@/lib/inquiries/status";
import { WORK_STATUS_LABELS, type WorkStatus } from "@/lib/projects/status";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/workspace/status";

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

const taskTones: Record<TaskStatus, Tone> = {
  todo: "outline",
  doing: "action",
  done: "neutral",
};

export function StatusBadge({ status }: { status: InquiryStatus }) {
  return <Badge label={INQUIRY_STATUS_LABELS[status]} tone={inquiryTones[status]} />;
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <Badge label={CLIENT_STATUS_LABELS[status]} tone={clientTones[status]} />;
}

export function ProjectStatusBadge({ status }: { status: WorkStatus }) {
  return <Badge label={WORK_STATUS_LABELS[status]} tone={projectTones[status]} />;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge label={TASK_STATUS_LABELS[status]} tone={taskTones[status]} />;
}
