import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { missions } from "../prisma/data/missions";
import type { BodySlug, PositionsSnapshot } from "../src/lib/orbits";

// Run after `npm run import:positions` and before committing the result. The
// daily refresh commits to main without review, so this refuses a snapshot
// that has lost anything the committed one had (which is what a Horizons
// outage or an interrupted run looks like) and reports whether anything but
// the fetch date changed. In GitHub Actions it sets the step output
// `changed` to true or false.
const FILE = "public/positions.json";

// A refresh that makes the file this much smaller is refused.
const MAX_SHRINK = 0.2;

function committed() {
  try {
    return execFileSync("git", ["show", `HEAD:${FILE}`], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
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

  if (!next.moon?.length) problems.push("the Moon has no orbits");

  if (before) {
    const old: PositionsSnapshot = JSON.parse(before);

    for (const body of Object.keys(old.bodies) as BodySlug[]) {
      if (!next.bodies[body]?.length) problems.push(`${body} has no orbits`);
    }

    // A route may only go when no craft uses its Horizons entry any more.
    const inUse = new Set(
      missions.flatMap((mission) =>
        mission.spacecraft.flatMap((craft) => craft.horizonsId ?? []),
      ),
    );

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

  const changed = !before || content(JSON.parse(before)) !== content(next);

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
