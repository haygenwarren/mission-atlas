import { writeFile } from "node:fs/promises";
import path from "node:path";
import { catalogue } from "../prisma/data/catalogue";
import { missions } from "../prisma/data/missions";
import {
  between,
  bodyPosition,
  daysSinceJ2000,
  distance,
  MOON_SHARE,
  orbitPosition,
  placements,
  type BodySlug,
  type Days,
  type Elements,
  type PositionsSnapshot,
  type RoutePoint,
  type Vec3,
} from "../src/lib/orbits";

// Saves what the map needs to place things into public/positions.json: a
// series of orbits for every planet, asteroid and comet and for the Moon, and
// the route of every spacecraft JPL Horizons tracks. The browser downloads the
// file directly, so the site never depends on Horizons being up. Run it after
// adding a horizonsId to prisma/data/missions.ts, and often enough that craft
// still on their way stay current: Horizons revises their predicted paths as
// they manoeuvre.
// JPL Horizons: ssd.jpl.nasa.gov/horizons
const API = "https://ssd.jpl.nasa.gov/api/horizons.api";
const OUTPUT = path.join(process.cwd(), "public/positions.json");
const FIRST_DAY = "1959-01-01"; // before Luna 2, the earliest mission here
const YEARS_AHEAD = 10;
const KM_PER_AU = 149_597_870.7;
const SUN = "500@10";
const EARTH = "500@399";

// How closely the file follows Horizons. Near now, from 90 days before the
// first of this month to two years after it, every position is within
// NEAR_KM: closer than astronomy-engine gets for any planet. Further back or
// ahead the positions only feed trails and animations, where FAR_KM (a fifth
// of the way to the Moon) cannot show.
const NEAR_KM = 1_000;
const FAR_KM = 75_000;
const NEAR_DAYS_BEFORE = 90;
const NEAR_DAYS_AFTER = 730;

// Fits are checked at the times Horizons gave positions for, but the map
// needs positions in between too, so they aim this far inside the targets.
const MARGIN = 0.8;

// A craft that ends up at a body is drawn at that body once it arrives, and
// its route stops there. It has arrived once it stays within this distance
// (AU), wide enough for orbits around the giant planets.
const ARRIVAL_DISTANCE: Partial<Record<BodySlug, number>> = {
  earth: 0.02, // takes in the Moon and the L2 point
  mercury: 0.002,
  venus: 0.007,
  mars: 0.007,
  jupiter: 0.35,
  saturn: 0.45,
};
const SMALL_BODY_ARRIVAL_DISTANCE = 0.01;

// Faster than any craft has flown (Parker Solar Probe peaks near 0.11 AU a
// day). A daily position that would need more is an error in the data:
// Horizons has Akatsuki jump 3 AU from Venus for a week in 2025.
const MAX_SPEED = 0.2; // AU per day

// How Horizons names each body. Planets with moons use the centre of mass of
// the planet and its moons: an orbit fitted to a planet's centre wobbles as
// its moons pull it about. Earth is fitted at the Earth–Moon barycentre ("3")
// and corrected with the Moon's orbit. Numbers ending in ";" are asteroids;
// comets use the orbit solution for the apparition closest to today.
const HORIZONS_BODIES: Record<BodySlug, string> = {
  mercury: "199",
  venus: "299",
  earth: "3",
  mars: "4",
  jupiter: "5",
  saturn: "6",
  uranus: "7",
  neptune: "8",
  pluto: "9",
  ceres: "1;",
  vesta: "4;",
  psyche: "16;",
  lutetia: "21;",
  ida: "243;",
  mathilde: "253;",
  eros: "433;",
  gaspra: "951;",
  steins: "2867;",
  itokawa: "25143;",
  donaldjohanson: "52246;",
  didymos: "65803;",
  bennu: "101955;",
  dinkinesh: "152830;",
  ryugu: "162173;",
  arrokoth: "486958;",
  halley: "DES=1P;CAP;NOFRAG",
  "tempel-1": "DES=9P;CAP;NOFRAG",
  "grigg-skjellerup": "DES=26P;CAP;NOFRAG",
  "67p-churyumov-gerasimenko": "DES=67P;CAP;NOFRAG",
  "wild-2": "DES=81P;CAP;NOFRAG",
  "hartley-2": "DES=103P;CAP;NOFRAG",
};

const MONTHS = "JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC";

// The largest miss allowed at time t, in AU.
type Tolerance = (t: Days) => number;

// A position from Horizons to check the file against.
type Check = [t: Days, position: Vec3];

type Query = {
  command: string;
  type: "ELEMENTS" | "VECTORS";
  center: string;
  start: string;
  stop: string;
  step: string;
};

// Asks Horizons for one body or craft and returns the rows of its table,
// split into cells. Vectors come with velocities, in AU and days.
async function horizons(query: Query) {
  const params = {
    format: "text",
    COMMAND: query.command,
    EPHEM_TYPE: query.type,
    CENTER: query.center,
    REF_PLANE: "ECLIPTIC",
    START_TIME: query.start,
    STOP_TIME: query.stop,
    STEP_SIZE: query.step,
    OUT_UNITS: "AU-D",
    VEC_TABLE: "2",
    CSV_FORMAT: "YES",
  };
  // Horizons wants every value except `format` in single quotes.
  const search = Object.entries(params)
    .map(([key, value]) =>
      key === "format"
        ? `${key}=${value}`
        : `${key}=${encodeURIComponent(`'${value}'`)}`,
    )
    .join("&");
  const response = await fetch(`${API}?${search}`);

  if (!response.ok) {
    throw new Error(`${query.command}: HTTP ${response.status}`);
  }

  const text = await response.text();
  const start = text.indexOf("$$SOE");
  const end = text.indexOf("$$EOE");

  if (start === -1 || end === -1) {
    return { rows: null, text };
  }

  const rows = text
    .slice(start + 5, end)
    .trim()
    .split("\n")
    .map((line) => line.split(",").map((cell) => cell.trim()));

  return { rows, text };
}

async function table(query: Query) {
  const { rows, text } = await horizons(query);

  if (!rows) {
    throw new Error(
      `${query.command}: nothing from Horizons.\n${text.slice(0, 600)}`,
    );
  }

  return rows;
}

const round = (value: number, places: number) =>
  Math.round(value * 10 ** places) / 10 ** places;

// Ten significant figures keep every body within a few kilometres of where
// the full figures put it.
const figures = (cell: string) => Number(Number(cell).toPrecision(10));

const day = (cell: string) => round(Number(cell) - 2_451_545, 4);

// Candidate orbits, one every `step`.
async function candidateOrbits(
  command: string,
  center: string,
  start: string,
  stop: string,
  step: string,
) {
  const rows = await table({
    command,
    type: "ELEMENTS",
    center,
    start,
    stop,
    step,
  });

  // JDTDB, date, EC, QR, IN, OM, W, Tp, N, MA, TA, A, AD, PR
  return rows.map(
    (cells): Elements => [
      day(cells[0]),
      figures(cells[11]),
      figures(cells[2]),
      figures(cells[4]),
      figures(cells[5]),
      figures(cells[6]),
      figures(cells[9]),
      figures(cells[8]),
    ],
  );
}

// Positions to check orbits against, every `step`.
async function checks(
  command: string,
  center: string,
  start: string,
  stop: string,
  step: string,
) {
  const rows = await table({
    command,
    type: "VECTORS",
    center,
    start,
    stop,
    step,
  });

  // JDTDB, date, X, Y, Z, VX, VY, VZ
  return rows.map((cells): Check => [
    Number(cells[0]) - 2_451_545,
    [Number(cells[2]), Number(cells[3]), Number(cells[4])],
  ]);
}

type Timed = readonly [number, ...unknown[]];

const byTime = (a: Timed, b: Timed) => a[0] - b[0];

// A stretch where a fit could not get within tolerance.
type Rough = { from: Days; until: Days; km: number; at: Days };

// Picks as few of the candidate orbits as will keep every check within
// tolerance: one a year to begin with, then the candidate nearest the worst
// miss, again and again until nothing misses. Where every candidate around a
// miss is already in use (a comet swinging close past Jupiter can change
// faster than the candidates are spaced), it notes the stretch and moves on.
// `at` turns a series of orbits into a position.
function fit(
  candidates: Elements[],
  checked: Check[],
  tolerance: Tolerance,
  at: (series: Elements[], t: Days) => Vec3 = orbitPosition,
) {
  const keep = new Set<number>();
  let lastKept = -Infinity;

  candidates.forEach(([epoch], i) => {
    if (epoch - lastKept >= 365 || i === candidates.length - 1) {
      keep.add(i);
      lastKept = epoch;
    }
  });

  const rough: Rough[] = [];

  for (;;) {
    const kept = [...keep].sort((a, b) => a - b);
    const series = kept.map((i) => candidates[i]);
    let worst = 1;
    let worstAt: Days | null = null;

    for (const [t, position] of checked) {
      if (rough.some(({ from, until }) => t >= from && t <= until)) continue;

      const miss = distance(at(series, t), position) / tolerance(t);

      if (miss > worst) {
        worst = miss;
        worstAt = t;
      }
    }

    if (worstAt === null) return { series, rough };

    // The kept orbits either side of the worst miss, and the candidate
    // between them nearest to it.
    const after = kept.findIndex((i) => candidates[i][0] > worstAt);
    const high = after === -1 ? candidates.length : kept[after];
    const low = after <= 0 ? -1 : kept[after - 1];
    let next = -1;

    for (let i = low + 1; i < high; i++) {
      if (
        next === -1 ||
        Math.abs(candidates[i][0] - worstAt) <
          Math.abs(candidates[next][0] - worstAt)
      ) {
        next = i;
      }
    }

    if (next === -1) {
      rough.push({
        from: low === -1 ? candidates[0][0] : candidates[low][0],
        until:
          high === candidates.length
            ? candidates[candidates.length - 1][0]
            : candidates[high][0],
        km: Math.round(worst * tolerance(worstAt) * KM_PER_AU),
        at: worstAt,
      });
      continue;
    }

    keep.add(next);
  }
}

// Fits a body's orbits: candidates every 10 days (2 for the Moon), checked
// every 5 days and every day near now. Where that is not close enough, it
// fetches a candidate and a check for every day of the stretch and fits
// again.
async function fitBody(
  name: string,
  command: string,
  center: string,
  checkCommand: string,
  window: {
    first: string;
    stop: string;
    near: { start: string; stop: string };
  },
  tolerance: Tolerance,
  at?: (series: Elements[], t: Days) => Vec3,
) {
  const { first, stop, near } = window;
  const step = command === "301" ? "2d" : "10d";
  let candidates = await candidateOrbits(command, center, first, stop, step);
  let checked = [
    ...(await checks(checkCommand, center, first, stop, "5d")),
    ...(await checks(checkCommand, center, near.start, near.stop, "1d")),
  ].sort(byTime);
  let result = fit(candidates, checked, tolerance, at);

  if (result.rough.length > 0) {
    for (const { from, until } of result.rough) {
      const start = horizonsTime(from, 1);
      const end = horizonsTime(until, -1);

      candidates = [
        ...candidates,
        ...(await candidateOrbits(command, center, start, end, "1d")),
      ];
      checked = [
        ...checked,
        ...(await checks(checkCommand, center, start, end, "1d")),
      ];
    }

    candidates = uniqueByTime(candidates.sort(byTime));
    checked = uniqueByTime(checked.sort(byTime));
    result = fit(candidates, checked, tolerance, at);
  }

  for (const { km, at: when } of result.rough) {
    const date = isoDay(new Date((when + 10_957.5) * 86_400_000));

    console.warn(
      `${name}: within ${km.toLocaleString("en-GB")} km at best around ${date}`,
    );
  }

  return result.series;
}

function uniqueByTime<T extends Timed>(items: T[]) {
  return items.filter((item, i) => i === 0 || item[0] !== items[i - 1][0]);
}

// Horizons explains a request outside a craft's tracking with a line such as
// 'No ephemeris for target "Stardust" after A.D. 2011-MAR-13 00:00:00.0000
// TDB'. Returns that edge as a time to ask for instead, nudged two minutes
// inside, since Horizons gives the edge in TDB but reads our times as UTC.
function trackingEdge(text: string) {
  const match = text.match(
    /No ephemeris for target .* (prior to|after) A\.D\. (\d{4})-([A-Z]{3})-(\d{2}) (\d{2}):(\d{2})/,
  );

  if (!match) return null;

  const [, side, year, month, date, hour, minute] = match;
  const edge = new Date(
    Date.UTC(
      Number(year),
      MONTHS.indexOf(month) / 3,
      Number(date),
      Number(hour),
      Number(minute),
    ),
  );

  edge.setUTCMinutes(edge.getUTCMinutes() + (side === "prior to" ? 2 : -2));

  return {
    side: side === "prior to" ? ("start" as const) : ("stop" as const),
    time: edge.toISOString().slice(0, 16).replace("T", " "),
  };
}

function withoutJumps(points: RoutePoint[]) {
  const kept = [points[0]];

  for (const point of points.slice(1)) {
    const last = kept[kept.length - 1];
    const moved = distance(
      [last[1], last[2], last[3]],
      [point[1], point[2], point[3]],
    );

    if (moved / (point[0] - last[0]) <= MAX_SPEED) kept.push(point);
  }

  return kept;
}

// A time as Horizons reads it, "2026-10-20 08:53", nudged a minute later or
// earlier so the time asked for stays inside a span Horizons covers.
function horizonsTime(t: Days, nudge: 1 | -1) {
  const date = new Date((t + 10_957.5) * 86_400_000 + nudge * 60_000);

  return date.toISOString().slice(0, 16).replace("T", " ");
}

// Positions and velocities for a craft every `step` from `start` to `stop`,
// trimmed to the span Horizons has tracking for. Returns null when the
// tracking has gaps, as for a craft only tracked once it left its carrier.
async function trackedPositions(
  horizonsId: string,
  start: string,
  stop: string,
  step: string,
) {
  let query: Query = {
    command: horizonsId,
    type: "VECTORS",
    center: SUN,
    start,
    stop,
    step,
  };

  for (let attempt = 0; attempt < 4; attempt++) {
    const { rows, text } = await horizons(query);

    if (rows) {
      // JDTDB, date, X, Y, Z, VX, VY, VZ
      return withoutJumps(
        rows.map(
          (cells): RoutePoint => [
            Number(cells[0]) - 2_451_545,
            ...(cells.slice(2, 8).map(Number) as [
              number,
              number,
              number,
              number,
              number,
              number,
            ]),
          ],
        ),
      );
    }

    if (text.includes("Insufficient ephemeris data")) return null;

    const edge = trackingEdge(text);

    if (!edge) {
      throw new Error(
        `${horizonsId}: no positions from Horizons.\n${text.slice(0, 600)}`,
      );
    }

    query = { ...query, [edge.side]: edge.time };
  }

  throw new Error(`${horizonsId}: could not find the span Horizons tracks.`);
}

// Drops points the route can do without, the way a map simplifies a coast:
// a point stays only if leaving it out would put the craft further from where
// Horizons has it, at that time, than the tolerance allows. It measures with
// the same curve the map draws between points.
function simplify(points: RoutePoint[], tolerance: Tolerance) {
  if (points.length <= 2) return points;

  const keep = new Array<boolean>(points.length).fill(false);
  const stack: [number, number][] = [[0, points.length - 1]];

  keep[0] = true;
  keep[points.length - 1] = true;

  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    let worst = 1;
    let worstIndex = -1;

    for (let i = first + 1; i < last; i++) {
      const [t, x, y, z] = points[i];
      const miss =
        distance(between(points[first], points[last], t), [x, y, z]) /
        tolerance(t);

      if (miss > worst) {
        worst = miss;
        worstIndex = i;
      }
    }

    if (worstIndex !== -1) {
      keep[worstIndex] = true;
      stack.push([first, worstIndex], [worstIndex, last]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

// Stretches where a simplified route had to keep daily points on consecutive
// days: the route changes too sharply there for daily positions to follow.
// Each is padded by a day either side.
function sharpStretches(kept: RoutePoint[]) {
  const stretches: [from: Days, until: Days][] = [];

  for (let i = 1; i < kept.length; i++) {
    const gap = kept[i][0] - kept[i - 1][0];

    if (gap < 0.9 || gap > 1.1) continue;

    const last = stretches[stretches.length - 1];

    if (last && kept[i - 1][0] - 1 <= last[1]) {
      last[1] = kept[i][0] + 1;
    } else {
      stretches.push([kept[i - 1][0] - 1, kept[i][0] + 1]);
    }
  }

  return stretches;
}

// Replaces the samples between `from` and `until` with hourly ones.
async function withHourly(
  horizonsId: string,
  samples: RoutePoint[],
  from: Days,
  until: Days,
) {
  const hourly = await trackedPositions(
    horizonsId,
    horizonsTime(from, 1),
    horizonsTime(until, -1),
    "1h",
  );

  if (!hourly) return samples;

  const first = hourly[0][0];
  const last = hourly[hourly.length - 1][0];

  return [
    ...samples.filter(([t]) => t < first),
    ...hourly,
    ...samples.filter(([t]) => t > last),
  ];
}

// Cuts a route where the craft arrives at the body it stays at: the start of
// the final stretch spent near that body. Returns the route unchanged if it
// never arrived (tracking ended on the way), or null if the craft never left
// the body's neighbourhood at all (craft in Earth orbit, at L2 or the Moon).
function untilArrival(
  points: RoutePoint[],
  arrived: (point: RoutePoint) => boolean,
) {
  let i = points.length;

  while (i > 0 && arrived(points[i - 1])) i--;

  if (i === points.length) return points;
  if (i === 0) return null;

  return points.slice(0, i + 1);
}

// A craft's own catalogue launch time, or else its mission's, which is where
// Horizons tracking can begin.
function launchOf(slug: string) {
  for (const mission of missions) {
    for (const craft of mission.spacecraft) {
      if (craft.slug !== slug) continue;

      const own =
        craft.catalogueId && catalogue[craft.catalogueId]?.launchDate;
      const first = mission.spacecraft[0].catalogueId;

      return (
        own ||
        mission.launchDate ||
        (first && catalogue[first]?.launchDate) ||
        null
      );
    }
  }

  return null;
}

// One line per body or route, so a refresh shows up in a diff as changed
// lines rather than one enormous one.
function serialise(snapshot: PositionsSnapshot) {
  const block = (entries: Record<string, unknown>) =>
    Object.entries(entries)
      .map(([key, value]) => `    "${key}": ${JSON.stringify(value)}`)
      .join(",\n");

  return [
    "{",
    `  "source": ${JSON.stringify(snapshot.source)},`,
    `  "fetched": ${JSON.stringify(snapshot.fetched)},`,
    `  "from": ${snapshot.from},`,
    `  "until": ${snapshot.until},`,
    `  "accuracy": ${JSON.stringify(snapshot.accuracy)},`,
    `  "bodies": {\n${block(snapshot.bodies)}\n  },`,
    `  "moon": ${JSON.stringify(snapshot.moon)},`,
    `  "routes": {\n${block(snapshot.routes)}\n  }`,
    "}",
    "",
  ].join("\n");
}

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

function addDays(date: Date, days: number) {
  const result = new Date(date);

  result.setUTCDate(result.getUTCDate() + days);

  return result;
}

async function main() {
  const today = new Date();

  // The spans are measured from the first of the month, not from today, so
  // every run in a month asks Horizons for the same thing and writes the same
  // file unless Horizons' data has changed. The daily refresh only commits
  // when it has.
  const month = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  const until = new Date(month);

  until.setUTCFullYear(until.getUTCFullYear() + YEARS_AHEAD);

  const stop = isoDay(until);
  const nearStart = addDays(month, -NEAR_DAYS_BEFORE);
  const nearStop = addDays(month, NEAR_DAYS_AFTER);
  const near = { start: isoDay(nearStart), stop: isoDay(nearStop) };
  const nearFrom = daysSinceJ2000(nearStart);
  const nearUntil = daysSinceJ2000(nearStop);
  const tolerance: Tolerance = (t) =>
    (t >= nearFrom && t <= nearUntil ? NEAR_KM : FAR_KM) / KM_PER_AU;
  const aim: Tolerance = (t) => MARGIN * tolerance(t);

  const window = { first: FIRST_DAY, stop, near };

  // The Moon first, since Earth's position depends on it. A miss in the
  // Moon's position moves Earth by only MOON_SHARE of it, so the Moon may be
  // that much further off, with half of Earth's tolerance to spend.
  const moon = await fitBody(
    "moon",
    "301",
    EARTH,
    "301",
    window,
    (t) => aim(t) / (2 * MOON_SHARE),
  );

  console.log(`moon: ${moon.length} orbits`);

  const bodies = {} as Record<BodySlug, Elements[]>;

  // Earth's orbit is fitted at the barycentre but checked against Earth
  // itself, with the Moon's pull added.
  const earthWith = (series: Elements[], t: Days): Vec3 => {
    const [x, y, z] = orbitPosition(series, t);
    const [mx, my, mz] = orbitPosition(moon, t);

    return [x - MOON_SHARE * mx, y - MOON_SHARE * my, z - MOON_SHARE * mz];
  };

  for (const [slug, command] of Object.entries(HORIZONS_BODIES)) {
    const body = slug as BodySlug;
    const earth = body === "earth";

    bodies[body] = await fitBody(
      slug,
      command,
      SUN,
      earth ? "399" : command,
      window,
      aim,
      earth ? earthWith : orbitPosition,
    );
    console.log(`${slug}: ${bodies[body].length} orbits`);
  }

  // Craft that share a Horizons entry (a lander listed under its carrier)
  // share a route, so they must also end up at the same place.
  const tracked = new Map<
    string,
    { slugs: string[]; body: BodySlug | null }
  >();

  for (const mission of missions) {
    for (const craft of mission.spacecraft) {
      if (!craft.horizonsId) continue;

      const body = placements[craft.location];
      const entry = tracked.get(craft.horizonsId);

      if (entry && entry.body !== body) {
        throw new Error(
          `${craft.slug} shares Horizons entry ${craft.horizonsId} with ${entry.slugs.join(", ")} but ends up somewhere else.`,
        );
      }

      tracked.set(craft.horizonsId, {
        slugs: [...(entry?.slugs ?? []), craft.slug],
        body,
      });
    }
  }

  const routes: Record<string, RoutePoint[]> = {};

  for (const [horizonsId, { slugs, body }] of tracked) {
    const names = slugs.join(", ");
    const launch = launchOf(slugs[0]);

    if (!launch) throw new Error(`${slugs[0]}: no launch date.`);

    const daily = await trackedPositions(
      horizonsId,
      launch.slice(0, 16).replace("T", " "),
      stop,
      "1d",
    );

    if (!daily) {
      console.warn(`${names}: gaps in Horizons tracking, no route`);
      continue;
    }

    const reach = body
      ? (ARRIVAL_DISTANCE[body] ?? SMALL_BODY_ARRIVAL_DISTANCE)
      : 0;
    const route = body
      ? untilArrival(
          daily,
          ([t, x, y, z]) =>
            distance([x, y, z], bodyPosition({ bodies, moon }, body, t)) <=
            reach,
        )
      : daily;

    if (!route) {
      console.log(`${names}: never left ${body}, no route`);
      continue;
    }

    // Hourly positions where daily ones are too far apart to follow the
    // route: near now, and wherever the route turns sharply (a close flyby
    // of a planet, or a seam where Horizons hands over from one trajectory
    // file to the next).
    const end = route[route.length - 1][0];
    let samples = route;
    let sharp = 0;

    if (Math.max(route[0][0], nearFrom) < Math.min(end, nearUntil)) {
      samples = await withHourly(
        horizonsId,
        samples,
        Math.max(route[0][0], nearFrom),
        Math.min(end, nearUntil),
      );
    }

    for (const [from, until] of sharpStretches(simplify(samples, aim))) {
      samples = await withHourly(horizonsId, samples, from, Math.min(until, end));
      sharp++;
    }

    routes[horizonsId] = simplify(samples, aim).map(
      ([t, x, y, z, vx, vy, vz]) => [
        round(t, 4),
        round(x, 7),
        round(y, 7),
        round(z, 7),
        round(vx, 9),
        round(vy, 9),
        round(vz, 9),
      ],
    );

    const arrival = route.length < daily.length ? `, arrives at ${body}` : "";
    const hourly = sharp > 0 ? `, ${sharp} sharp turns hourly` : "";

    console.log(
      `${names}: ${samples.length} samples → ${routes[horizonsId].length} points${arrival}${hourly}`,
    );
  }

  const text = serialise({
    source: "JPL Horizons (ssd.jpl.nasa.gov/horizons)",
    fetched: isoDay(today),
    from: round(daysSinceJ2000(new Date(FIRST_DAY)), 1),
    until: round(daysSinceJ2000(until), 1),
    accuracy: {
      from: round(nearFrom, 1),
      until: round(nearUntil, 1),
      nearKm: NEAR_KM,
      farKm: FAR_KM,
    },
    bodies,
    moon,
    routes,
  });

  await writeFile(OUTPUT, text);

  console.log(
    `Saved ${Object.keys(bodies).length} bodies, the Moon and ${Object.keys(routes).length} routes to public/positions.json (${Math.round(text.length / 1024)} KB).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
