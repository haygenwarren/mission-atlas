import { statusLabels } from "@/lib/missions";
import type { Status } from "@/generated/prisma/enums";

// Active is filled with the brand's active-mission colour; the two inactive
// states are outlines, so the tag reads without relying on colour alone.
const statusClasses: Record<Status, string> = {
  ACTIVE: "border-active bg-active text-active-text",
  COMPLETED: "border-border-strong text-muted",
  FAILED: "border-danger text-danger",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`label-caps shrink-0 rounded-full border px-3 py-1 ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
