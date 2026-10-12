import { statusLabels } from "@/lib/missions";
import type { Status } from "@/generated/prisma/enums";

const statusClasses: Record<Status, string> = {
  ACTIVE: "bg-status-active",
  COMPLETED: "bg-status-completed",
  FAILED: "bg-status-failed",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`label-caps shrink-0 rounded-full px-3 py-1 text-status-text ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
