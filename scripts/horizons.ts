import { catalogue } from "../prisma/data/catalogue";
import { missions } from "../prisma/data/missions";
import {
  between,
  distance,
  type BodySlug,
  type Days,
  type Elements,
  type RoutePoint,
  type Vec3,
} from "../src/lib/orbits";

// What the importers share: asking JPL Horizons for positions and orbits,
// finding the span it tracks a craft for, and thinning a route down to the
// points the map needs.
// JPL Horizons: ssd.jpl.nasa.gov/horizons
const API = "https://ssd.jpl.nasa.gov/api/horizons.api";

export { KM_PER_AU } from "../src/lib/orbits";
export const SUN = "500@10";
export const EARTH = "500@399";

// A craft that ends up at a body is drawn at that body once it arrives, and
// its route stops there. It has arrived once it stays within this distance
// (AU), wide enough for orbits around the giant planets.
export const ARRIVAL_DISTANCE: Partial<Record<BodySlug, number>> = {
  earth: 0.02, // takes in the Moon and the L2 point
  mercury: 0.002,
  venus: 0.007,
  mars: 0.007,
  jupiter: 0.35,
  saturn: 0.45,
};
export const SMALL_BODY_ARRIVAL_DISTANCE = 0.01;

// Faster than any craft has flown (Parker Solar Probe peaks near 0.11 AU a
// day). A daily position that would need more is an error in the data:
// Horizons has Akatsuki jump 3 AU from Venus for a week in 2025.
export const MAX_SPEED = 0.2; // AU per day

export const MONTHS = "JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC";

// The largest miss allowed at time t, in AU.
export type Tolerance = (t: Days) => number;

// A position from Horizons to check the file against.
export type Check = [t: Days, position: Vec3];

export type Query = {
  command: string;
  type: "ELEMENTS" | "VECTORS";
  center: string;
  start: string;
  stop: string;
  step: string;
};

// Asks Horizons for one body or craft and returns the rows of its table,
// split into cells. Vectors come with velocities, in AU and days.
export async function horizons(query: Query) {
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

export async function table(query: Query) {
  const { rows, text } = await horizons(query);

  if (!rows) {
    throw new Error(
      `${query.command}: nothing from Horizons.\n${text.slice(0, 600)}`,
    );
  }

  return rows;
}

export const round = (value: number, places: number) =>
  Math.round(value * 10 ** places) / 10 ** places;

// Ten significant figures keep every body within a few kilometres of where
// the full figures put it.
export const figures = (cell: string) => Number(Number(cell).toPrecision(10));

export const day = (cell: string) => round(Number(cell) - 2_451_545, 4);

// Candidate orbits, one every `step`.
export async function candidateOrbits(
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
export async function checks(
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

export type Timed = readonly [number, ...unknown[]];

export const byTime = (a: Timed, b: Timed) => a[0] - b[0];

export function uniqueByTime<T extends Timed>(items: T[]) {
  return items.filter((item, i) => i === 0 || item[0] !== items[i - 1][0]);
}

// Horizons explains a request outside a craft's tracking with a line such as
// 'No ephemeris for target "Stardust" after A.D. 2011-MAR-13 00:00:00.0000
// TDB'. Returns that edge as a time to ask for instead, nudged two minutes
// inside, since Horizons gives the edge in TDB but reads our times as UTC.
export function trackingEdge(text: string) {
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

export function withoutJumps(points: RoutePoint[]) {
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
export function horizonsTime(t: Days, nudge: 1 | -1) {
  const date = new Date((t + 10_957.5) * 86_400_000 + nudge * 60_000);

  return date.toISOString().slice(0, 16).replace("T", " ");
}

// Positions and velocities for a craft every `step` from `start` to `stop`,
// measured from `center` (the Sun unless given), trimmed to the span Horizons
// has tracking for. Returns null when the tracking has gaps, as for a craft
// only tracked once it left its carrier.
export async function trackedPositions(
  horizonsId: string,
  start: string,
  stop: string,
  step: string,
  center = SUN,
) {
  let query: Query = {
    command: horizonsId,
    type: "VECTORS",
    center,
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
// Horizons has it, at that time, than the tolerance for that point allows. It
// measures with the same curve the map draws between points.
export function simplify(
  points: RoutePoint[],
  tolerance: (point: RoutePoint) => number,
) {
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
        tolerance(points[i]);

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

// Stretches where a simplified route had to keep points that were sampled
// `step` days apart on consecutive samples: the route changes too sharply
// there for samples that far apart to follow. Each is padded by a step
// either side.
export function sharpStretches(kept: RoutePoint[], step = 1) {
  const stretches: [from: Days, until: Days][] = [];

  for (let i = 1; i < kept.length; i++) {
    const gap = kept[i][0] - kept[i - 1][0];

    if (gap < 0.9 * step || gap > 1.1 * step) continue;

    const last = stretches[stretches.length - 1];

    if (last && kept[i - 1][0] - step <= last[1]) {
      last[1] = kept[i][0] + step;
    } else {
      stretches.push([kept[i - 1][0] - step, kept[i][0] + step]);
    }
  }

  return stretches;
}

// Replaces the samples between `from` and `until` with finer ones, `step`
// apart (hourly unless given), measured from `center`.
export async function withFiner(
  horizonsId: string,
  samples: RoutePoint[],
  from: Days,
  until: Days,
  step = "1h",
  center = SUN,
) {
  const finer = await trackedPositions(
    horizonsId,
    horizonsTime(from, 1),
    horizonsTime(until, -1),
    step,
    center,
  );

  if (!finer) return samples;

  const first = finer[0][0];
  const last = finer[finer.length - 1][0];

  return [
    ...samples.filter(([t]) => t < first),
    ...finer,
    ...samples.filter(([t]) => t > last),
  ];
}

// A craft's own catalogue launch time, or else its mission's, which is where
// Horizons tracking can begin.
export function launchOf(slug: string) {
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

export const isoDay = (date: Date) => date.toISOString().slice(0, 10);

export function addDays(date: Date, days: number) {
  const result = new Date(date);

  result.setUTCDate(result.getUTCDate() + days);

  return result;
}
