import { readFile } from "node:fs/promises";
import path from "node:path";
import type { LocalIndex, PositionsSnapshot } from "@/lib/orbits";

// The Horizons IDs of the craft whose journeys the map can replay: those with
// a route in public/positions.json, or a path around a body listed in
// public/local/index.json. The files only change with a new deploy, so the
// server reads them once. (next.config.ts makes sure they are deployed with
// the pages that read them.)
let replayable: Promise<Set<string>> | null = null;

async function keysOf(file: string, list: (json: unknown) => object) {
  try {
    const text = await readFile(path.join(process.cwd(), "public", file), "utf8");

    return Object.keys(list(JSON.parse(text)));
  } catch (error) {
    // Without the file, pages still work, only without those replays.
    console.error(`Could not read public/${file}:`, error);
    return [];
  }
}

export function replayableCraft() {
  replayable ??= Promise.all([
    keysOf("positions.json", (json) => (json as PositionsSnapshot).routes),
    keysOf("local/index.json", (json) => (json as LocalIndex).craft),
  ]).then(([routes, local]) => new Set([...routes, ...local]));

  return replayable;
}
