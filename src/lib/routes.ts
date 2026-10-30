import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PositionsSnapshot } from "@/lib/orbits";

// The Horizons IDs of the craft with a route in public/positions.json, the
// ones whose journeys the map can replay. The file only changes with a new
// deploy, so the server reads it once. (next.config.ts makes sure it is
// deployed with the pages that read it.)
let routed: Promise<Set<string>> | null = null;

export function craftWithRoutes() {
  routed ??= readFile(
    path.join(process.cwd(), "public", "positions.json"),
    "utf8",
  )
    .then(
      (text) =>
        new Set(Object.keys((JSON.parse(text) as PositionsSnapshot).routes)),
    )
    // Without the file, pages still work, only without replays.
    .catch((error) => {
      console.error("Could not read public/positions.json:", error);
      return new Set<string>();
    });

  return routed;
}
