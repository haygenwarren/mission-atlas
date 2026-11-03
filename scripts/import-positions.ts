import { writeFile } from "node:fs/promises";
import path from "node:path";
import { missions } from "../prisma/data/missions";
import {
  bodyPosition,
  daysSinceJ2000,
  distance,
  MOON_SHARE,
  orbitPosition,
  placements,
  type BodySlug,
  type Days,
  type MoonSlug,
  type Elements,
  type PositionsSnapshot,
  type RoutePoint,
  type Vec3,
} from "../src/lib/orbits";
import {
  ARRIVAL_DISTANCE,
  EARTH,
  KM_PER_AU,
  SMALL_BODY_ARRIVAL_DISTANCE,
  SUN,
  addDays,
  byTime,
  candidateOrbits,
  checks,
  horizonsTime,
  isoDay,
  launchOf,
  round,
  sharpStretches,
  simplify,
  trackedPositions,
  uniqueByTime,
  withFiner,
  type Check,
  type Tolerance,
} from "./horizons";

// Saves what the map needs to place things into public/positions.json: a
// series of orbits for every planet, asteroid and comet and for the Moon, and
// the route of every spacecraft JPL Horizons tracks. The browser downloads the
// file directly, so the site never depends on Horizons being up. Run it after
// adding a horizonsId to prisma/data/missions.ts, and often enough that craft
// still on their way stay current: Horizons revises their predicted paths as
// they manoeuvre.
const OUTPUT = path.join(process.cwd(), "public/positions.json");
const FIRST_DAY = "1959-01-01"; // before Luna 2, the earliest mission here
const YEARS_AHEAD = 10;

// How closely the file follows Horizons. Near now, from 90 days before the
// first of this month to two years after it, every position is within
// NEAR_KM: closer than astronomy-engine gets for any planet. Further back or
// ahead the positions only feed trails and animations, where FAR_KM (a fifth
// of the way to the Moon) cannot show.
const NEAR_KM = 1_000;
const FAR_KM = 75_000;
const NEAR_DAYS_BEFORE = 90;
const NEAR_DAYS_AFTER = 730;

// Moons are drawn only as they are now, so their orbits are fitted closely
// for a shorter span: from a month back to six months ahead. The daily
// refresh keeps it current.
const MOON_DAYS_BEFORE = 31;
const MOON_DAYS_AFTER = 183;

// Fits are checked at the times Horizons gave positions for, but the map
// needs positions in between too, so they aim this far inside the targets.
const MARGIN = 0.8;

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

// Each moon in Horizons, and the centre of the planet it circles.
const HORIZONS_MOONS: Record<MoonSlug, [command: string, center: string]> = {
  moon: ["301", EARTH],
  io: ["501", "500@599"],
  europa: ["502", "500@599"],
  ganymede: ["503", "500@599"],
  callisto: ["504", "500@599"],
  titan: ["606", "500@699"],
  enceladus: ["602", "500@699"],
};

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

// Fits a moon's orbits around its planet: closely through the moon span,
// from orbits a day apart checked every six hours (Io goes round Jupiter in
// under two days), and elsewhere from orbits `step` apart, with any further
// checks given.
async function fitMoon(
  name: string,
  window: { first: string; stop: string },
  moonSpan: { start: string; stop: string },
  tolerance: Tolerance,
  step = "365d",
  extraChecks: Check[] = [],
) {
  const [command, center] = HORIZONS_MOONS[name as MoonSlug];
  const candidates = uniqueByTime(
    [
      ...(await candidateOrbits(command, center, window.first, window.stop, step)),
      ...(await candidateOrbits(
        command,
        center,
        moonSpan.start,
        moonSpan.stop,
        "1d",
      )),
    ].sort(byTime),
  );
  const checked = [
    ...extraChecks,
    ...(await checks(command, center, moonSpan.start, moonSpan.stop, "6h")),
  ].sort(byTime);
  const { series, rough } = fit(candidates, checked, tolerance);

  for (const { km, at } of rough) {
    const date = isoDay(new Date((at + 10_957.5) * 86_400_000));

    console.warn(
      `${name}: within ${km.toLocaleString("en-GB")} km at best around ${date}`,
    );
  }

  return series;
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
    `  "moonsFrom": ${snapshot.moonsFrom},`,
    `  "moonsUntil": ${snapshot.moonsUntil},`,
    `  "moons": {\n${block(snapshot.moons)}\n  },`,
    `  "routes": {\n${block(snapshot.routes)}\n  }`,
    "}",
    "",
  ].join("\n");
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
  const moonStart = addDays(month, -MOON_DAYS_BEFORE);
  const moonStop = addDays(month, MOON_DAYS_AFTER);
  const moonSpan = { start: isoDay(moonStart), stop: isoDay(moonStop) };
  const moonsFrom = daysSinceJ2000(moonStart);
  const moonsUntil = daysSinceJ2000(moonStop);
  const inMoonSpan = (t: Days) => t >= moonsFrom && t <= moonsUntil;

  // The Moon first, since Earth's position depends on it. It is drawn to
  // the usual accuracy through the moon span. Elsewhere it only has to place
  // Earth, and a miss in the Moon's position moves Earth by only MOON_SHARE
  // of it, so it may be that much further off, with half of Earth's
  // tolerance to spend.
  const moons = {} as Record<MoonSlug, Elements[]>;

  moons.moon = await fitMoon(
    "moon",
    window,
    moonSpan,
    (t) => (inMoonSpan(t) ? aim(t) : aim(t) / (2 * MOON_SHARE)),
    "2d",
    [
      ...(await checks("301", EARTH, FIRST_DAY, stop, "5d")),
      ...(await checks("301", EARTH, near.start, near.stop, "1d")),
    ],
  );
  console.log(`moon: ${moons.moon.length} orbits`);

  const moon = moons.moon;

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

  // The other moons only matter as they are now: rough elsewhere.
  for (const slug of Object.keys(HORIZONS_MOONS) as MoonSlug[]) {
    if (slug === "moon") continue;

    moons[slug] = await fitMoon(slug, window, moonSpan, (t) =>
      inMoonSpan(t) ? aim(t) : Infinity,
    );
    console.log(`${slug}: ${moons[slug].length} orbits`);
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
            distance([x, y, z], bodyPosition({ bodies, moons }, body, t)) <=
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
      samples = await withFiner(
        horizonsId,
        samples,
        Math.max(route[0][0], nearFrom),
        Math.min(end, nearUntil),
      );
    }

    for (const [from, until] of sharpStretches(
      simplify(samples, ([t]) => aim(t)),
    )) {
      samples = await withFiner(
        horizonsId,
        samples,
        from,
        Math.min(until, end),
      );
      sharp++;
    }

    routes[horizonsId] = simplify(samples, ([t]) => aim(t)).map(
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
    moonsFrom: round(moonsFrom, 1),
    moonsUntil: round(moonsUntil, 1),
    moons,
    routes,
  });

  await writeFile(OUTPUT, text);

  console.log(
    `Saved ${Object.keys(bodies).length} bodies, ${Object.keys(moons).length} moons and ${Object.keys(routes).length} routes to public/positions.json (${Math.round(text.length / 1024)} KB).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
