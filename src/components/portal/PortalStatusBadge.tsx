import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { PORTAL_STATUS_LABELS, type PortalWorkStatus } from "@/lib/portal/status";

const tones: Record<PortalWorkStatus, BadgeTone> = {
  active: "action",
  planned: "signal",
  on_hold: "strong",
  completed: "neutral",
};

/** A project's status in the client's words ("In progress", not the admin's "Active"). */
export function PortalStatusBadge({ status }: { status: PortalWorkStatus }) {
  return <Badge label={PORTAL_STATUS_LABELS[status]} tone={tones[status]} />;
}
