import Link from "next/link";
import {
  agencyList,
  destinationList,
  statusLabels,
  type MissionWithLinks,
} from "@/lib/missions";
import type { Status } from "@/generated/prisma/enums";

const statusBadgeClasses: Record<Status, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-200 text-gray-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function MissionTile({ mission }: { mission: MissionWithLinks }) {
  return (
    <Link
      href={`/missions/${mission.slug}`}
      className="flex flex-col rounded-xl border p-5 transition hover:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">{mission.name}</h2>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses[mission.status]}`}
        >
          {statusLabels[mission.status]}
        </span>
      </div>

      <p className="mt-1 text-sm text-gray-600">
        {agencyList(mission)} · {mission.launchDate.getUTCFullYear()}
      </p>
      <p className="mt-1 text-sm text-gray-600">{destinationList(mission)}</p>

      <p className="mt-3 line-clamp-3 text-sm text-gray-700">
        {mission.description}
      </p>
    </Link>
  );
}
