import Link from "next/link";
import StatusBadge from "@/components/status-badge";
import {
  agencyList,
  destinationList,
  type MissionTileData,
} from "@/lib/missions";

export default function MissionTile({ mission }: { mission: MissionTileData }) {
  return (
    <Link
      href={`/missions/${mission.slug}`}
      className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">{mission.name}</h2>
        <StatusBadge status={mission.status} />
      </div>

      <p className="mt-1 text-sm text-muted">
        {agencyList(mission)} · {mission.launchDate.getUTCFullYear()}
      </p>
      <p className="mt-1 text-sm text-muted">{destinationList(mission)}</p>

      <p className="mt-3 line-clamp-3 text-sm">{mission.description}</p>
    </Link>
  );
}
