import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { missions } from "../prisma/data/missions";
import {
  MOONS,
  type BodySlug,
  type LocalIndex,
  type LocalPath,
  type MoonSlug,
  type PositionsSnapshot,
} from "../src/lib/orbits";

// Run after `npm run import:positions` and `npm run import:local`, and
// before committing the result. The daily refresh commits to main without
// review, so this refuses a snapshot that has lost anything the committed
// one had (which is what a Horizons outage or an interrupted run looks like)
// and reports whether anything but the fetch dates changed. In GitHub Actions
// it sets the step output `changed` to true or false.
const FILE = "public/positions.json";
const LOCAL = "public/local";
// The Moon's own path, kept alongside the craft's.
const MOON_ID = "301";

// A refresh that makes the file this much smaller is refused.
const MAX_SHRINK = 0.2;

function committed(file = FILE) {
  try {
    return execFileSync("git", ["show", `HEAD:${file}`], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

// The paths around a body (public/local): what has gone missing since the
// last commit, and whether any has changed.
function checkLocal(inUse: Set<string>) {
  const problems: string[] = [];
  const indexFile = `${LOCAL}/index.json`;
  const next: LocalIndex = JSON.parse(
    readFileSync(path.join(process.cwd(), indexFile), "utf8"),
  );
  const before = committed(indexFile);
  const old: LocalIndex | null = before ? JSON.parse(before) : null;
  let changed =
    !old ||
    JSON.stringify({ ...old, fetched: null }) !==
      JSON.stringify({ ...next, fetched: null });

  for (const id of Object.keys(old?.craft ?? {})) {
    if ((inUse.has(id) || id === MOON_ID) && !next.craft[id]) {
      problems.push(
        `the path around a body for Horizons entry ${id} is missing`,
      );
    }
  }

  for (const id of Object.keys(next.craft)) {
    const file = `${LOCAL}/${id}.json`;

    if (!existsSync(file)) {
      problems.push(`${file} is missing`);
      continue;
    }

    const text = readFileSync(file, "utf8");
    const local: LocalPath = JSON.parse(text);

    if (local.path.length + local.orbits.length === 0) {
      problems.push(`${file} is empty`);
    }

    changed ||= text !== committed(file);
  }

  return { problems, changed };
}

const kilobytes = (text: string) => `${Math.round(text.length / 1024)} KB`;

// Everything but the date the snapshot was fetched.
const content = (snapshot: PositionsSnapshot) =>
  JSON.stringify({ ...snapshot, fetched: null });

function main() {
  const after = readFileSync(path.join(process.cwd(), FILE), "utf8");
  const next: PositionsSnapshot = JSON.parse(after);
  const before = committed();
  const problems: string[] = [];
  // A route or path may only go when no craft uses its Horizons entry any
  // more.
  const inUse = new Set(
    missions.flatMap((mission) =>
      mission.spacecraft.flatMap((craft) => craft.horizonsId ?? []),
    ),
  );
  const local = checkLocal(inUse);

  problems.push(...local.problems);

  for (const moon of Object.keys(MOONS) as MoonSlug[]) {
    if (!next.moons?.[moon]?.length) problems.push(`${moon} has no orbits`);
  }

  if (before) {
    const old: PositionsSnapshot = JSON.parse(before);

    for (const body of Object.keys(old.bodies) as BodySlug[]) {
      if (!next.bodies[body]?.length) problems.push(`${body} has no orbits`);
    }

    for (const id of Object.keys(old.routes)) {
      if (inUse.has(id) && !next.routes[id]?.length) {
        problems.push(`the route for Horizons entry ${id} is missing`);
      }
    }

    if (after.length < before.length * (1 - MAX_SHRINK)) {
      problems.push(
        `the file shrank from ${kilobytes(before)} to ${kilobytes(after)}`,
      );
    }
  }

  if (problems.length > 0) {
    console.error(
      `Refusing the new snapshot:\n${problems.map((p) => `- ${p}`).join("\n")}`,
    );
    process.exit(1);
  }

  const changed =
    !before || content(JSON.parse(before)) !== content(next) || local.changed;

  console.log(
    changed
      ? `Horizons' data has changed (${kilobytes(after)}).`
      : "Nothing has changed but the fetch date.",
  );

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  }
}

main();
