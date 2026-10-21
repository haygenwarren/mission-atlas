"use client";

import { useEffect, useState } from "react";
import MissionTile from "@/components/mission-tile";
import { sample } from "@/lib/random";
import type { MissionTileData } from "@/lib/missions";

const SHOWN = 6;

// The home page is cached, so the server cannot pick different missions for
// each visitor. It sends a pool instead, and this picks from it in the
// browser on every load.
export default function FeaturedMissions({
  pool,
}: {
  pool: MissionTileData[];
}) {
  const [picks, setPicks] = useState<MissionTileData[] | null>(null);

  useEffect(() => {
    setPicks(sample(pool, SHOWN));
  }, [pool]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {picks
        ? picks.map((mission) => (
            <MissionTile key={mission.id} mission={mission} />
          ))
        : Array.from({ length: SHOWN }, (_, i) => (
            <div
              key={i}
              aria-hidden
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              <div className="aspect-[3/2] bg-picture" />
              <div className="h-44" />
            </div>
          ))}
    </div>
  );
}
