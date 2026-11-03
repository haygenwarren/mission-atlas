import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { missions } from "../prisma/data/missions";
import {
  RADIUS_KM,
  daysSinceJ2000,
  placements,
  type BodySlug,
  type Days,
  type LocalEntry,
  type LocalIndex,
  type LocalPath,
  type RoutePoint,
} from "../src/lib/orbits";
import {
  ARRIVAL_DISTANCE,
  EARTH,
  KM_PER_AU,
  addDays,
  byTime,
  candidateOrbits,
  horizonsTime,
  isoDay,
  launchOf,
  round,
  sharpStretches,
  simplify,
  trackedPositions,
  uniqueByTime,
  withFiner,
} from "./horizons";

// Saves the paths spacecraft followed around the planet (or Earth) they
// stayed at, measured from that body, into public/local: Cassini's tour of
// Saturn, JWST's orbit around L2, a lander's last approach to Mars, the climb
// out to the Moon. The map draws them when zoomed in close and replays them
// after a mission's cruise. public/positions.json has the routes between the
// planets; run this after `npm run import:positions` (the daily refresh runs
// both).
// JPL Horizons: ssd.jpl.nasa.gov/horizons
const DIRECTORY = path.join(process.cwd(), "public/local");

// The bodies craft can have paths around, as Horizons names their centres.
const CENTERS: Partial<Record<BodySlug, string>> = {
  mercury: "500@199",
  venus: "500@299",
  earth: EARTH,
  mars: "500@499",
  jupiter: "500@599",
  saturn: "500@699",
};
const MOON = "500@301";
// The Moon in Horizons, which is also how the map finds its path.
const MOON_ID = "301";

// A craft counts as captured by its body once its orbit turns back within
// this distance of it (km): about a third of the way out to where the Sun's
// pull overtakes the body's (its Hill sphere). Further out, the Sun pulls an
// orbit about too much for it to place the craft (BepiColombo's slow
// approach to Mercury, or Akatsuki's wide orbit of Venus).
const CAPTURE_KM: Partial<Record<BodySlug, number>> = {
  mercury: 70_000,
  venus: 300_000,
  earth: 500_000,
  mars: 300_000,
  jupiter: 15_000_000,
  saturn: 20_000_000,
};

// A craft bound for the Moon is drawn at the Moon once it stays within this
// distance of it (km), so its path from Earth stops there.
const MOON_ARRIVAL_KM = 60_000;

// A path is only worth drawing while the craft is further from its body than
// this many of the body's radii. Closer in, even at the map's closest zoom it
// hugs the body: Hubble, or a Mars orbiter after aerobraking.
const VISIBLE_RADII = 3;

// A craft has to stay near Earth this many days from launch for its time
// there to count, as Gaia's years at L2 do before it left; a probe leaving
// for the planets passes out of Earth's neighbourhood in days.
const MIN_STAY_DAYS = 30;

// A path is kept point by point for up to this many laps of its body (all of
// Cassini's tour). Beyond that it would run to megabytes (Mars Express has
// gone round over 30,000 times), so it is kept as a series of orbits.
const MAX_LAPS = 300;

// How closely a path follows Horizons: within this share of the craft's
// distance from its body, or MIN_KM if more. That keeps any miss to a pixel
// or two at whatever zoom shows the craft's surroundings.
const TOLERANCE_SHARE = 0.003;
const TOLERANCE_MIN_KM = 100;

// Paths run on this many days past today where Horizons has a prediction,
// enough for an arrival coming up, such as BepiColombo's at Mercury.
const DAYS_AHEAD = 730;

// Hourly positions are fetched this many days at a time, well under the
// number of lines Horizons returns at once.
const CHUNK_DAYS = 1_000;

// Orbits are kept one about a month apart, or more often for a short stay;
// near now, one a day (four for a craft going round in under a day), from a
// week before the first of this month to two months after it (the daily
// refresh keeps that current).
const ORBITS_PER_STAY = 40;
const NEAR_DAYS_BEFORE = 7;
const NEAR_DAYS_AFTER = 62;

const toKm = (au: number) => au * KM_PER_AU;
// How far a point is from the centre it was measured from.
const fromCentre = ([, x, y, z]: RoutePoint) => Math.hypot(x, y, z);

// Positions and velocities every `step` from `from` to `until`, measured
// from `center`, fetched a chunk at a time.
async function positions(
  horizonsId: string,
  center: string,
  from: Days,
  until: Days,
  step: string,
) {
  const points: RoutePoint[] = [];

  for (let start = from; start < until; start += CHUNK_DAYS) {
    const chunk = await trackedPositions(
      horizonsId,
      horizonsTime(start, 1),
      horizonsTime(Math.min(until, start + CHUNK_DAYS), -1),
      step,
      center,
    );

    if (!chunk) return null;

    const last = points.at(-1)?.[0] ?? -Infinity;

    points.push(...chunk.filter(([t]) => t > last));
  }

  return points;
}

// The body a craft stayed at, if it is one it can have a path around: where
// it ended up, or Earth for a craft that worked at L2 and later left.
function bodyOf(craft: { location: keyof typeof placements }, l2: boolean) {
  const body = placements[craft.location];

  if (body && CENTERS[body]) return body;

  return l2 ? ("earth" as const) : null;
}

// The days a craft spent near its body, from daily positions measured from
// it: from its arrival to the end of tracking (all of it, for a craft that
// never left), or from launch until it left for one that worked near Earth
// and then moved off (Gaia, retired from L2 into an orbit round the Sun).
function stay(daily: RoutePoint[], reach: number): [Days, Days] | null {
  const near = (point: RoutePoint) => fromCentre(point) <= reach;
  let arrived = daily.length;

  while (arrived > 0 && near(daily[arrived - 1])) arrived--;

  if (arrived < daily.length) {
    return [daily[arrived][0], daily[daily.length - 1][0]];
  }

  const left = daily.findIndex((point) => !near(point));

  return left > 0 && daily[left][0] - daily[0][0] >= MIN_STAY_DAYS
    ? [daily[0][0], daily[left][0]]
    : null;
}

// How many times the craft went round its body: the stay's length over its
// usual (median) orbital period, from orbits a tenth of the stay apart.
async function laps(
  horizonsId: string,
  center: string,
  from: Days,
  until: Days,
) {
  const step = `${Math.max(1, Math.round((until - from) / 10))}d`;
  const orbits = await candidateOrbits(
    horizonsId,
    center,
    horizonsTime(from, 1),
    horizonsTime(until, -1),
    step,
  );
  // Elements: epoch, a, e, ..., mean motion (degrees a day).
  const periods = orbits
    .filter(([, , e]) => e < 1)
    .map(([, , , , , , , n]) => 360 / n)
    .sort((a, b) => a - b);

  return periods.length === 0
    ? 0
    : (until - from) / periods[Math.floor(periods.length / 2)];
}

// Stretches that lie close together are fetched as one, up to this many
// days long: a craft swinging close past its body every few hours needs one
// request, not one per pass.
const MERGE_GAP_DAYS = 2;
const MERGE_MAX_DAYS = 20;

function merged(stretches: [Days, Days][]) {
  const result: [Days, Days][] = [];

  for (const [from, until] of stretches) {
    const last = result.at(-1);

    if (
      last &&
      from - last[1] < MERGE_GAP_DAYS &&
      until - last[0] <= MERGE_MAX_DAYS
    ) {
      last[1] = until;
    } else {
      result.push([from, until]);
    }
  }

  return result;
}

// Hourly positions over the span (or `step` apart), made finer (every five
// minutes) where the path bends too sharply for those: close passes of the
// body, a lander's last hours. Then thinned to the tolerance.
async function pointByPoint(
  horizonsId: string,
  center: string,
  from: Days,
  until: Days,
  step = "1h",
) {
  let samples = await positions(horizonsId, center, from, until, step);

  if (!samples) return null;

  const tolerance = (point: RoutePoint) =>
    Math.max(
      TOLERANCE_MIN_KM / KM_PER_AU,
      TOLERANCE_SHARE * fromCentre(point),
    );

  for (const [start, end] of merged(
    sharpStretches(simplify(samples, tolerance), 1 / 24),
  )) {
    samples = await withFiner(
      horizonsId,
      samples,
      Math.max(start, from),
      Math.min(end, until),
      "5m",
      center,
    );
  }

  return simplify(samples, tolerance).map(
    ([t, x, y, z, vx, vy, vz]): RoutePoint => [
      round(t, 5),
      round(x, 9),
      round(y, 9),
      round(z, 9),
      round(vx, 11),
      round(vy, 11),
      round(vz, 11),
    ],
  );
}

// For a craft that went round many times: its path point by point until it
// was captured into orbit, then its orbits. An arriving craft comes in on a
// path no orbit around the body describes. One never captured, by that
// measure, within its first two months keeps its whole path point by point.
async function asOrbits(
  horizonsId: string,
  center: string,
  from: Days,
  until: Days,
  capture: number,
  period: Days,
  near: { from: Days; until: Days },
) {
  // Captured once every orbit from then on is closed (eccentricity under 1)
  // and turns back within the capture distance, judged from orbits six
  // hours apart over the first two months.
  const opening = await candidateOrbits(
    horizonsId,
    center,
    horizonsTime(from, 1),
    horizonsTime(Math.min(until, from + 60), -1),
    "6h",
  );
  const open = opening.findLastIndex(
    ([, a, e]) => e >= 1 || a * (1 + e) > capture,
  );

  if (open === opening.length - 1) {
    const points = await pointByPoint(horizonsId, center, from, until);

    return points && { path: points, orbits: [] };
  }

  const captured = open === -1 ? from : opening[open + 1][0];
  const points =
    captured > from
      ? await pointByPoint(horizonsId, center, from, captured)
      : [];

  if (!points) return null;

  const step = Math.min(
    30,
    Math.max(1, Math.round((until - captured) / ORBITS_PER_STAY)),
  );
  const nearFrom = Math.max(captured, near.from);
  const nearUntil = Math.min(until, near.until);
  const orbits = [
    ...(await candidateOrbits(
      horizonsId,
      center,
      horizonsTime(captured, 1),
      horizonsTime(until, -1),
      `${step}d`,
    )),
    ...(nearFrom < nearUntil
      ? await candidateOrbits(
          horizonsId,
          center,
          horizonsTime(nearFrom, 1),
          horizonsTime(nearUntil, -1),
          // Several a day for a craft going round in under a day.
          period < 1 ? "6h" : "1d",
        )
      : []),
  ];

  return {
    path: points,
    orbits: uniqueByTime(orbits.sort(byTime)).filter(([, , e]) => e < 1),
  };
}

// One line per point or orbit, so a refresh shows in a diff as changed lines.
function serialise(local: LocalPath) {
  const list = (items: unknown[]) =>
    items.length === 0
      ? "[]"
      : `[\n${items.map((item) => `    ${JSON.stringify(item)}`).join(",\n")}\n  ]`;
  const { path: points, orbits, ...entry } = local;

  return [
    "{",
    ...Object.entries(entry).map(
      ([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`,
    ),
    `  "path": ${list(points)},`,
    `  "orbits": ${list(orbits)}`,
    "}",
    "",
  ].join("\n");
}

async function readIndex(): Promise<LocalIndex | null> {
  try {
    return JSON.parse(
      await readFile(path.join(DIRECTORY, "index.json"), "utf8"),
    );
  } catch {
    return null;
  }
}

const fileFor = (horizonsId: string) =>
  path.join(DIRECTORY, `${horizonsId}.json`);

const dayOf = (t: Days) => isoDay(new Date((t + 10_957.5) * 86_400_000));

async function main() {
  const today = new Date();
  // As in import-positions, spans count from the first of the month, so
  // runs within a month ask Horizons the same questions.
  const month = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  const stop = daysSinceJ2000(addDays(month, DAYS_AHEAD));
  const near = {
    from: daysSinceJ2000(addDays(month, -NEAR_DAYS_BEFORE)),
    until: daysSinceJ2000(addDays(month, NEAR_DAYS_AFTER)),
  };
  const monthStart = daysSinceJ2000(month);
  const full = process.argv.includes("--full");
  const previous = await readIndex();
  const index: LocalIndex = {
    source: "JPL Horizons (ssd.jpl.nasa.gov/horizons)",
    fetched: isoDay(today),
    craft: {},
  };

  await mkdir(DIRECTORY, { recursive: true });

  // Craft that share a Horizons entry (a lander listed under its carrier)
  // share a path.
  const tracked = new Map<
    string,
    { slugs: string[]; body: BodySlug; l2: boolean; moon: boolean }
  >();

  for (const mission of missions) {
    const l2 = mission.destinations.includes("sun-earth-l2");

    for (const craft of mission.spacecraft) {
      const body = craft.horizonsId && bodyOf(craft, l2);

      if (!craft.horizonsId || !body) continue;

      const entry = tracked.get(craft.horizonsId);

      tracked.set(craft.horizonsId, {
        slugs: [...(entry?.slugs ?? []), craft.slug],
        body,
        l2: l2 || craft.location === "sun-earth-l2",
        moon: craft.location === "moon",
      });
    }
  }

  for (const [horizonsId, { slugs, body, l2, moon }] of tracked) {
    const names = slugs.join(", ");
    const center = CENTERS[body]!;
    const launch = launchOf(slugs[0]);

    if (!launch) throw new Error(`${slugs[0]}: no launch date.`);

    const daily = await trackedPositions(
      horizonsId,
      launch.slice(0, 16).replace("T", " "),
      horizonsTime(stop, -1),
      "1d",
      center,
    );

    if (!daily) {
      console.log(`${names}: gaps in Horizons tracking, no path`);
      continue;
    }

    const span = stay(daily, ARRIVAL_DISTANCE[body]!);

    if (!span) {
      console.log(`${names}: not near ${body} yet`);
      continue;
    }

    const from = span[0];
    let until = span[1];

    // A craft bound for the Moon: its path from Earth ends where it stays
    // near the Moon. One tracked only once it was there has none.
    if (moon) {
      const nearMoon = await trackedPositions(
        horizonsId,
        horizonsTime(from, 1),
        horizonsTime(until, -1),
        "1d",
        MOON,
      );
      let arrived = nearMoon?.length ?? 0;

      while (
        arrived > 0 &&
        toKm(fromCentre(nearMoon![arrived - 1])) <= MOON_ARRIVAL_KM
      ) {
        arrived--;
      }

      if (nearMoon && arrived < nearMoon.length) {
        until = nearMoon[arrived][0];
      }

      if (until - from < 1) {
        console.log(`${names}: tracked only at the Moon, no path`);
        continue;
      }
    }

    // Cut where the craft stays too close to its body to see.
    const visible = (VISIBLE_RADII * RADIUS_KM[body]!) / KM_PER_AU;
    const within = daily.filter(([t]) => t >= from && t <= until);
    const lastSeen = within.findLast((point) => fromCentre(point) > visible);

    if (!lastSeen) {
      console.log(`${names}: never far enough from ${body} to see, no path`);
      continue;
    }

    until = Math.min(until, lastSeen[0] + 1);

    const distances = within
      .filter(([t]) => t <= until)
      .map(fromCentre)
      .sort((a, b) => a - b);
    const entry: LocalEntry = {
      body,
      from: round(from, 5),
      until: round(until, 5),
      reach: round(distances[Math.floor(distances.length * 0.9)], 9),
      ...(l2 && body === "earth" ? { frame: "sun-earth" as const } : {}),
    };

    // A stay that ended before this month, fetched before, has not changed
    // (unless asked to fetch everything again with --full).
    const before = previous?.craft[horizonsId];

    if (
      !full &&
      before &&
      until < monthStart &&
      before.from === entry.from &&
      before.until === entry.until
    ) {
      index.craft[horizonsId] = before;
      console.log(`${names}: unchanged`);
      continue;
    }

    const rounds = await laps(horizonsId, center, from, until);
    const parts =
      rounds > MAX_LAPS
        ? await asOrbits(
            horizonsId,
            center,
            from,
            until,
            CAPTURE_KM[body]! / KM_PER_AU,
            (until - from) / rounds,
            near,
          )
        : await pointByPoint(horizonsId, center, from, until).then(
            (points) => points && { path: points, orbits: [] },
          );

    if (!parts) {
      console.log(`${names}: gaps in Horizons tracking, no path`);
      continue;
    }

    const local: LocalPath = { ...entry, ...parts };

    index.craft[horizonsId] = entry;
    await writeFile(fileFor(horizonsId), serialise(local));
    console.log(
      `${names}: around ${body} ${dayOf(from)} to ${dayOf(until)}, ${Math.round(rounds)} laps, ${local.path.length} points and ${local.orbits.length} orbits`,
    );
  }

  // The Moon's own path around Earth, through the years craft have paths
  // near Earth point by point: the positions snapshot only keeps the Moon
  // close near now, and a replay needs it where a craft bound for it
  // arrives, or beside JWST at L2. (A replay of a craft circling Earth every
  // few days, kept as orbits, runs too fast for the Moon's place to show.)
  // Its orbit is smooth, so positions six hours apart are fine enough.
  const nearEarth: LocalEntry[] = [];

  for (const [id, entry] of Object.entries(index.craft)) {
    if (entry.body !== "earth" || id === MOON_ID) continue;

    const local: LocalPath = JSON.parse(await readFile(fileFor(id), "utf8"));

    if (local.orbits.length === 0) nearEarth.push(entry);
  }

  if (nearEarth.length > 0) {
    const from = Math.min(...nearEarth.map((entry) => entry.from));
    const until = Math.max(...nearEarth.map((entry) => entry.until));
    const before = previous?.craft[MOON_ID];
    const points =
      !full && before?.from === from && before.until === until
        ? null
        : await pointByPoint(MOON_ID, EARTH, from, until, "6h");

    if (points) {
      const entry: LocalEntry = { body: "earth", from, until, reach: 0.0027 };

      index.craft[MOON_ID] = entry;
      await writeFile(
        fileFor(MOON_ID),
        serialise({ ...entry, path: points, orbits: [] }),
      );
      console.log(`the Moon: around earth, ${points.length} points`);
    } else if (before) {
      index.craft[MOON_ID] = before;
    }
  }

  // Files for craft no longer listed.
  for (const file of await readdir(DIRECTORY)) {
    const id = file.replace(/\.json$/, "");

    if (file !== "index.json" && !index.craft[id]) await rm(fileFor(id));
  }

  await writeFile(
    path.join(DIRECTORY, "index.json"),
    [
      "{",
      `  "source": ${JSON.stringify(index.source)},`,
      `  "fetched": ${JSON.stringify(index.fetched)},`,
      `  "craft": {`,
      Object.entries(index.craft)
        .map(
          ([id, entry]) => `    ${JSON.stringify(id)}: ${JSON.stringify(entry)}`,
        )
        .join(",\n"),
      "  }",
      "}",
      "",
    ].join("\n"),
  );

  console.log(
    `Saved paths around their bodies for ${Object.keys(index.craft).length} craft to public/local.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
