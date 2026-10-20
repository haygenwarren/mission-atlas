import { writeFile } from "node:fs/promises";
import path from "node:path";
import { catalogue } from "../prisma/data/catalogue";
import { missions } from "../prisma/data/missions";
import {
  between,
  bodyPosition,
  daysSinceJ2000,
  placements,
  type BodySlug,
  type Elements,
  type PositionsSnapshot,
  type RoutePoint,
} from "../src/lib/orbits";

// Saves what the map needs to place things into public/positions.json: a
// set of orbital elements per year for every planet, asteroid and comet, and
// the route of every spacecraft JPL Horizons tracks. The browser downloads the
// file directly, so the site never depends on Horizons being up. Run it after
// adding a horizonsId to prisma/data/missions.ts, and every few months so
// craft still on their way stay current.
// JPL Horizons: ssd.jpl.nasa.gov/horizons
const API = "https://ssd.jpl.nasa.gov/api/horizons.api";
const OUTPUT = path.join(process.cwd(), "public/positions.json");
const FIRST_DAY = "1959-01-01"; // before Luna 2, the earliest mission here
const YEARS_AHEAD = 10;

// A route keeps only the points needed to stay within this distance of
// Horizons' daily positions: 0.0005 AU (75,000 km, a fifth of the way to the
// Moon) out to 1 AU from the Sun, and the same angle as seen from the Sun
// beyond that. Out among the giant planets the map shows far larger
// distances, so Voyager at 170 AU can be 0.085 AU off without showing.
const TOLERANCE = 0.0005;

// A craft that ends up at a body is drawn at that body once it arrives, and
// its route stops there. It has arrived once it stays within this distance
// (AU), wide enough for orbits around the giant planets and for the error in
// our positions of small bodies.
const ARRIVAL_DISTANCE: Partial<Record<BodySlug, number>> = {
  earth: 0.02, // takes in the Moon and the L2 point
  mercury: 0.002,
  venus: 0.007,
  mars: 0.007,
  jupiter: 0.35,
  saturn: 0.45,
};
const SMALL_BODY_ARRIVAL_DISTANCE = 0.01;

// How Horizons names each body. Planets with moons use the centre of mass of
// the planet and its moons ("3" is the Earth–Moon barycentre): the Moon
// swings Earth around it every month, which would throw an orbit fitted to
// Earth itself out by 500,000 km within months. Numbers ending in ";" are
// asteroids; comets use the orbit solution for the apparition closest to
// today.
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

type Query = {
  command: string;
  type: "ELEMENTS" | "VECTORS";
  start: string;
  stop: string;
  step: string;
};

// Asks Horizons for one body or craft and returns the rows of its table,
// split into cells. Positions are from the Sun's centre, in the ecliptic.
async function horizons(query: Query) {
  const params = {
    format: "text",
    COMMAND: query.command,
    EPHEM_TYPE: query.type,
    CENTER: "500@10",
    REF_PLANE: "ECLIPTIC",
    START_TIME: query.start,
    STOP_TIME: query.stop,
    STEP_SIZE: query.step,
    OUT_UNITS: "AU-D",
    VEC_TABLE: "1",
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

// Horizons explains a request outside a craft's tracking with a line such as
// 'No ephemeris for target "Stardust" after A.D. 2011-MAR-13 00:00:00.0000
// TDB'. Returns that edge as a time to ask for instead, nudged two minutes
// inside, since Horizons gives the edge in TDB but reads our times as UTC.
function trackingEdge(text: string) {
  const match = text.match(
    /No ephemeris for target .* (prior to|after) A\.D\. (\d{4})-([A-Z]{3})-(\d{2}) (\d{2}):(\d{2})/,
  );

  if (!match) return null;

  const [, side, year, month, day, hour, minute] = match;
  const edge = new Date(
    Date.UTC(
      Number(year),
      MONTHS.indexOf(month) / 3,
      Number(day),
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

const round = (value: number, places: number) =>
  Math.round(value * 10 ** places) / 10 ** places;

// Eight significant figures keeps every body within a few hundred kilometres
// of where the full figures put it, far less than the yearly orbits' own
// error, and keeps the file smaller.
const figures = (cell: string) => Number(Number(cell).toPrecision(8));

async function bodyElements(command: string, stop: string) {
  const { rows, text } = await horizons({
    command,
    type: "ELEMENTS",
    start: FIRST_DAY,
    stop,
    step: "365d",
  });

  if (!rows) {
    throw new Error(
      `${command}: no elements from Horizons.\n${text.slice(0, 600)}`,
    );
  }

  // JDTDB, date, EC, QR, IN, OM, W, Tp, N, MA, TA, A, AD, PR
  return rows.map(
    (cells): Elements => [
      round(Number(cells[0]) - 2_451_545, 4),
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

// Faster than any craft has flown (Parker Solar Probe peaks near 0.11 AU a
// day). A daily position that would need more is an error in the data:
// Horizons has Akatsuki jump 3 AU from Venus for a week in 2025.
const MAX_SPEED = 0.2; // AU per day

function withoutJumps(points: RoutePoint[]) {
  const kept = [points[0]];

  for (const point of points.slice(1)) {
    const [t0, x0, y0] = kept[kept.length - 1];
    const [t, x, y] = point;

    if (Math.hypot(x - x0, y - y0) / (t - t0) <= MAX_SPEED) {
      kept.push(point);
    }
  }

  return kept;
}

// Daily positions for a craft from its launch to `stop`, trimmed to the span
// Horizons has tracking for. Returns null when the tracking has gaps, as for
// a craft that was only tracked once it separated from its carrier.
async function dailyPositions(
  horizonsId: string,
  launch: string,
  stop: string,
) {
  let query: Query = {
    command: horizonsId,
    type: "VECTORS",
    start: launch,
    stop,
    step: "1d",
  };

  for (let attempt = 0; attempt < 4; attempt++) {
    const { rows, text } = await horizons(query);

    if (rows) {
      // JDTDB, date, X, Y, Z
      return withoutJumps(
        rows.map(
          (cells): RoutePoint => [
            Number(cells[0]) - 2_451_545,
            Number(cells[2]),
            Number(cells[3]),
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
// a point stays only if leaving it out would put the craft more than
// TOLERANCE from where Horizons has it at that time. It measures with the
// same arc-around-the-Sun the map uses between points, and at the same time,
// so the craft's speed along the route stays right as well as its path.
function simplify(points: RoutePoint[]) {
  if (points.length <= 2) return points;

  const keep = new Array<boolean>(points.length).fill(false);
  const stack: [number, number][] = [[0, points.length - 1]];

  keep[0] = true;
  keep[points.length - 1] = true;

  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    let worst = 0;
    let worstIndex = -1;

    for (let i = first + 1; i < last; i++) {
      const [t, x, y] = points[i];
      const [px, py] = between(points[first], points[last], t);
      const off = Math.hypot(x - px, y - py) / Math.max(1, Math.hypot(x, y));

      if (off > worst) {
        worst = off;
        worstIndex = i;
      }
    }

    if (worst > TOLERANCE) {
      keep[worstIndex] = true;
      stack.push([first, worstIndex], [worstIndex, last]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

// Cuts a route where the craft arrives at the body it stays at: the start of
// the final stretch spent near that body. Returns the route unchanged if it
// never arrived (tracking ended on the way), or null if the craft never left
// the body's neighbourhood at all (craft in Earth orbit, at L2 or the Moon).
function untilArrival(
  points: RoutePoint[],
  series: Elements[],
  distance: number,
) {
  let i = points.length;

  while (i > 0) {
    const [t, x, y] = points[i - 1];
    const [bx, by] = bodyPosition(series, t);

    if (Math.hypot(x - bx, y - by) > distance) break;
    i--;
  }

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
    `  "bodies": {\n${block(snapshot.bodies)}\n  },`,
    `  "routes": {\n${block(snapshot.routes)}\n  }`,
    "}",
    "",
  ].join("\n");
}

async function main() {
  const today = new Date();
  const until = new Date(today);

  until.setUTCFullYear(until.getUTCFullYear() + YEARS_AHEAD);

  const stop = until.toISOString().slice(0, 10);
  const bodies = {} as Record<BodySlug, Elements[]>;

  for (const [slug, command] of Object.entries(HORIZONS_BODIES)) {
    const series = await bodyElements(command, stop);

    bodies[slug as BodySlug] = series;
    console.log(`${slug}: ${series.length} years of elements`);
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
    const launch = launchOf(slugs[0]);

    if (!launch) throw new Error(`${slugs[0]}: no launch date.`);

    const daily = await dailyPositions(
      horizonsId,
      launch.slice(0, 16).replace("T", " "),
      stop,
    );

    const names = slugs.join(", ");

    if (!daily) {
      console.warn(`${names}: gaps in Horizons tracking, no route`);
      continue;
    }

    const route = body
      ? untilArrival(
          daily,
          bodies[body],
          ARRIVAL_DISTANCE[body] ?? SMALL_BODY_ARRIVAL_DISTANCE,
        )
      : daily;

    if (!route) {
      console.log(`${names}: never left ${body}, no route`);
      continue;
    }

    routes[horizonsId] = simplify(route).map(([t, x, y]) => [
      round(t, 4),
      round(x, 5),
      round(y, 5),
    ]);

    const arrival = route.length < daily.length ? `, arrives at ${body}` : "";

    console.log(
      `${names}: ${daily.length} days → ${routes[horizonsId].length} points${arrival}`,
    );
  }

  const text = serialise({
    source: "JPL Horizons (ssd.jpl.nasa.gov/horizons)",
    fetched: today.toISOString().slice(0, 10),
    from: round(daysSinceJ2000(new Date(FIRST_DAY)), 1),
    until: round(daysSinceJ2000(until), 1),
    bodies,
    routes,
  });

  await writeFile(OUTPUT, text);

  console.log(
    `Saved ${Object.keys(bodies).length} bodies and ${Object.keys(routes).length} routes to public/positions.json (${Math.round(text.length / 1024)} KB).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
