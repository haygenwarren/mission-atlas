import Image from "next/image";
import Link from "next/link";
import MissionImage from "@/components/mission-image";
import StatusBadge from "@/components/status-badge";
import {
  agencyList,
  destinationList,
  type MissionTileData,
} from "@/lib/missions";

// The picture's credit is on the mission page the tile links to.
export default function MissionTile({ mission }: { mission: MissionTileData }) {
  return (
    <Link
      href={`/missions/${mission.slug}`}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent"
    >
      {mission.imageUrl ? (
        <MissionImage
          src={mission.imageUrl}
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          className="aspect-[3/2]"
        />
      ) : (
        <div className="flex aspect-[3/2] items-center justify-center bg-picture">
          <Image
            src="/brand/mission-atlas-mark-small.svg"
            alt=""
            width={56}
            height={56}
            className="opacity-60"
          />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{mission.name}</h2>
          <StatusBadge status={mission.status} />
        </div>

        <p className="mt-1 text-sm text-muted">
          {agencyList(mission)} · {mission.launchDate.getUTCFullYear()}
        </p>
        <p className="mt-1 text-sm text-muted">{destinationList(mission)}</p>

        <p className="mt-3 line-clamp-3 text-sm">{mission.description}</p>
      </div>
    </Link>
  );
}
