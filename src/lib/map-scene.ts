import type { Status } from "@/generated/prisma/enums";
import {
  MOONS,
  between,
  bodyPosition,
  KM_PER_AU,
  daysSinceJ2000,
  distance,
  localOffset,
  moonPosition,
  placements,
  routePosition,
  type BodySlug,
  type Days,
  type Elements,
  type LocalPath,
  type MoonSlug,
  type PositionsSnapshot,
  type RoutePoint,
  type Vec3,
} from "@/lib/orbits";

// What the map needs to know about each spacecraft, from the database.
export type MapCraft = {
  slug: string;
  name: string;
  status: Status;
  horizonsId: string | null;
  location: keyof typeof placements;
  // ISO date or time, when known.
  lastContact: string | null;
  mission: {
    slug: string;
    name: string;
    status: Status;
    imageUrl: string | null;
    imageCredit: string | null;
    imageLicense: string | null;
    imageLicenseUrl: string | null;
    imageSourceUrl: string | null;
    agencies: { abbreviation: string; name: string }[];
  };
};

// What the map places things with: the snapshot, and the paths of craft
// around their bodies (public/local) loaded so far, keyed by Horizons ID.
export type Positions = PositionsSnapshot & {
  local?: Record<string, LocalPath>;
};

// Where the map can put a craft at a given time: on its route, at the body it
// sits at (and the moon, if it is at one), or nowhere, because tracking ended
// (or never existed) while it was out in space. At a body, `offset` is where
// it is measured from the body, when its path there is known.
export type Place =
  | { kind: "route"; position: Vec3 }
  | {
      kind: "body";
      body: BodySlug;
      moon: MoonSlug | null;
      offset: Vec3 | null;
    }
  | { kind: "unknown"; since: Days | null };

export type Scene = {
  t: Days;
  earth: Vec3;
  // Craft at a moon are listed with the moon, not its planet.
  bodies: { slug: BodySlug; position: Vec3; craft: MapCraft[] }[];
  moons: {
    slug: MoonSlug;
    parent: BodySlug;
    position: Vec3;
    craft: MapCraft[];
  }[];
  free: { craft: MapCraft; position: Vec3 }[];
  // Craft at a body whose position around it is known. They are counted
  // with their body too, and drawn apart from it once the map is zoomed in
  // far enough to show the gap.
  local: {
    craft: MapCraft;
    body: BodySlug;
    position: Vec3;
    offset: Vec3;
  }[];
  unknown: { craft: MapCraft; since: Days | null }[];
};

// The destinations that are moons the map draws.
const MOON_DESTINATIONS: Partial<Record<string, MoonSlug>> = {
  moon: "moon",
  europa: "europa",
  ganymede: "ganymede",
  titan: "titan",
};

// Names of the moons that are not destinations in the archive.
export const MOON_NAMES: Record<MoonSlug, string> = {
  moon: "Moon",
  io: "Io",
  europa: "Europa",
  ganymede: "Ganymede",
  callisto: "Callisto",
  titan: "Titan",
  enceladus: "Enceladus",
};

export const PLANETS: BodySlug[] = [
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
];

export const DWARF_PLANETS: BodySlug[] = ["pluto", "ceres"];

// A craft's place on its path around a body at time t, if that path is
// loaded and covers t.
function onLocalPath(
  craft: MapCraft,
  snapshot: Positions,
  t: Days,
): Place | null {
  const local = craft.horizonsId ? snapshot.local?.[craft.horizonsId] : null;
  const offset = local && localOffset(local, t);

  return offset
    ? { kind: "body", body: local.body, moon: null, offset }
    : null;
}

// Where a craft sits once it has arrived: at the body it stays at.
function atBody(craft: MapCraft): Place | null {
  const body = placements[craft.location];

  return body
    ? {
        kind: "body",
        body,
        moon: MOON_DESTINATIONS[craft.location] ?? null,
        offset: null,
      }
    : null;
}

// Where a moon is at time t. The Moon comes from its own path around Earth
// when that is loaded (for a replay near Earth), which is far closer than
// the snapshot away from now.
export function moonAt(snapshot: Positions, slug: MoonSlug, t: Days): Vec3 {
  const path = slug === "moon" ? snapshot.local?.["301"] : null;
  const offset = path && localOffset(path, t);

  if (!offset) return moonPosition(snapshot, slug, t);

  const [x, y, z] = bodyPosition(snapshot, "earth", t);

  return [x + offset[0], y + offset[1], z + offset[2]];
}

export function placeCraft(
  craft: MapCraft,
  snapshot: Positions,
  t: Days,
): Place {
  const route = craft.horizonsId ? snapshot.routes[craft.horizonsId] : null;
  const onRoute = route && routePosition(route, t);

  if (onRoute) return { kind: "route", position: onRoute };

  const place = onLocalPath(craft, snapshot, t) ?? atBody(craft);

  if (place) return place;

  // Out in space with no position now: say since when.
  const routeEnd = route ? route[route.length - 1][0] : null;
  const contact = craft.lastContact
    ? daysSinceJ2000(new Date(craft.lastContact))
    : null;
  const known = [routeEnd, contact].filter((day) => day !== null);

  return {
    kind: "unknown",
    since: known.length > 0 ? Math.max(...known) : null,
  };
}

// Where a craft was at time t during a replay of its journey: on its path
// around a body while it was there, on its route while it was flying it, then
// at the body it stays at once those end. Before either begins, or with
// neither (a probe carried aboard another craft), it is not shown.
export function placeOnJourney(
  craft: MapCraft,
  snapshot: Positions,
  t: Days,
): Place {
  const unknown: Place = { kind: "unknown", since: null };
  const local = onLocalPath(craft, snapshot, t);

  if (local) return local;

  const id = craft.horizonsId;
  const route = id ? snapshot.routes[id] : null;
  const path = id ? snapshot.local?.[id] : null;

  if (!(route && t >= route[0][0]) && !(path && t >= path.from)) {
    return unknown;
  }

  const onRoute = route && routePosition(route, t);

  if (onRoute) return { kind: "route", position: onRoute };

  return atBody(craft) ?? unknown;
}

// Where everything is at time t. `place` decides where each craft goes: by
// default where the map would show it now, or `placeOnJourney` for a replay.
export function buildScene(
  snapshot: Positions,
  craft: MapCraft[],
  t: Days,
  place = placeCraft,
): Scene {
  const atBody = new Map<BodySlug, MapCraft[]>();
  const atMoon = new Map<MoonSlug, MapCraft[]>();
  const free: Scene["free"] = [];
  const local: Scene["local"] = [];
  const unknown: Scene["unknown"] = [];

  for (const one of craft) {
    const where = place(one, snapshot, t);

    if (where.kind === "route") {
      free.push({ craft: one, position: where.position });
    } else if (where.kind === "body" && where.moon) {
      atMoon.set(where.moon, [...(atMoon.get(where.moon) ?? []), one]);
    } else if (where.kind === "body") {
      atBody.set(where.body, [...(atBody.get(where.body) ?? []), one]);

      if (where.offset) {
        const [x, y, z] = bodyPosition(snapshot, where.body, t);
        const [dx, dy, dz] = where.offset;

        local.push({
          craft: one,
          body: where.body,
          position: [x + dx, y + dy, z + dz],
          offset: where.offset,
        });
      }
    } else {
      unknown.push({ craft: one, since: where.since });
    }
  }

  const bodies = (Object.keys(snapshot.bodies) as BodySlug[]).map((slug) => ({
    slug,
    position: bodyPosition(snapshot, slug, t),
    craft: atBody.get(slug) ?? [],
  }));

  const moons = (Object.keys(MOONS) as MoonSlug[]).map((slug) => ({
    slug,
    parent: MOONS[slug],
    position: moonAt(snapshot, slug, t),
    craft: atMoon.get(slug) ?? [],
  }));

  return {
    t,
    earth: bodyPosition(snapshot, "earth", t),
    bodies,
    moons,
    free,
    local,
    unknown,
  };
}

const SUN: Vec3 = [0, 0, 0];
const LIGHT_SECONDS_PER_AU = 499.004784;

export function fromSun(position: Vec3) {
  return distance(position, SUN);
}

// "2.31 AU", "172 AU", or in kilometres when close: "1.5 million km".
export function formatDistance(au: number) {
  if (au < 0.1) {
    const km = au * KM_PER_AU;
    // To the hundred km under 100,000 km, so a close orbit still reads.
    const step = km < 1e5 ? 100 : 1000;

    return km < 1e6
      ? `${(Math.round(km / step) * step).toLocaleString("en-GB")} km`
      : `${(km / 1e6).toFixed(1)} million km`;
  }

  return `${au < 10 ? au.toFixed(2) : Math.round(au).toLocaleString("en-GB")} AU`;
}

// How long a radio signal takes over that distance: "1 s", "13 min",
// "23 h 47 min".
export function formatLightTime(au: number) {
  const seconds = au * LIGHT_SECONDS_PER_AU;
  const minutes = Math.round(seconds / 60);

  if (seconds < 59.5) return `${Math.max(1, Math.round(seconds))} s`;
  if (minutes < 60) return `${minutes} min`;

  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

// A route sampled finely enough to draw as a smooth curve: each stretch
// between stored points is split into pieces no longer than 0.02 AU (at
// most 32), following the same curve the map uses for positions.
export function routeSamples(route: RoutePoint[]) {
  const samples: [t: Days, x: number, y: number][] = [];

  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const length = Math.hypot(b[1] - a[1], b[2] - a[2]);
    const steps = Math.min(32, Math.max(1, Math.ceil(length / 0.02)));

    for (let k = 0; k < steps; k++) {
      const t = a[0] + ((b[0] - a[0]) * k) / steps;
      const [x, y] = between(a, b, t);

      samples.push([t, x, y]);
    }
  }

  const last = route[route.length - 1];

  samples.push([last[0], last[1], last[2]]);

  return samples;
}

// A craft's path around its body, ready to draw around wherever the body is.
export type LocalTrail = {
  body: BodySlug;
  // [t, u, v]: positions from the body in the plane of the planets, close
  // enough together to draw as a smooth curve. For a craft at L2 (`turn`),
  // each is turned back by how far Earth had gone round the Sun at that
  // time; drawn turned by Earth's angle at the moment shown, the trail keeps
  // its shape beyond Earth from the Sun, as mission diagrams draw it.
  points: [t: Days, u: number, v: number][];
  turn: boolean;
  // How long one lap of its body usually took, in days (Infinity for a path
  // that never went round): the trail is drawn strongly for the last few
  // laps and faintly before that.
  lap: Days;
  // How far from the body the craft usually was (AU).
  reach: number;
  // For a craft kept as orbits once it settled: its orbits, from `settled`.
  orbits: Elements[];
  settled: Days;
};

// The direction from the Sun to Earth at time t, as an angle in the plane of
// the planets.
export function earthAngle(snapshot: Positions, t: Days) {
  const [x, y] = bodyPosition(snapshot, "earth", t);

  return Math.atan2(y, x);
}

// A path around a body, sampled finely enough to draw: each stretch between
// stored points is split into pieces no longer than a twentieth of the
// craft's distance from the body (at most 32), so close passes stay smooth.
export function localTrail(local: LocalPath, snapshot: Positions): LocalTrail {
  const { path } = local;
  const turn = local.frame === "sun-earth";
  const points: LocalTrail["points"] = [];
  const add = (t: Days, x: number, y: number) => {
    const angle = turn ? earthAngle(snapshot, t) : 0;
    const c = Math.cos(-angle);
    const s = Math.sin(-angle);

    points.push([t, c * x - s * y, s * x + c * y]);
  };

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const near = Math.min(Math.hypot(a[1], a[2]), Math.hypot(b[1], b[2]));
    const length = Math.hypot(b[1] - a[1], b[2] - a[2]);
    const steps = Math.min(32, Math.max(1, Math.ceil(length / (near / 20))));

    for (let k = 0; k < steps; k++) {
      const t = a[0] + ((b[0] - a[0]) * k) / steps;
      const [x, y] = between(a, b, t);

      add(t, x, y);
    }
  }

  const last = path.at(-1);

  if (last) add(last[0], last[1], last[2]);

  // Laps counted as closest approaches to the body: the stored points
  // nearer to it than both their neighbours.
  const near = path.map(([, x, y, z]) => Math.hypot(x, y, z));
  const passes = near.filter(
    (d, i) => i > 0 && i < near.length - 1 && d < near[i - 1] && d < near[i + 1],
  ).length;
  const lap =
    local.orbits.length > 0
      ? 360 / local.orbits[0][7]
      : passes > 1
        ? (local.until - local.from) / passes
        : Infinity;

  return {
    body: local.body,
    points,
    turn,
    lap,
    reach: local.reach,
    orbits: local.orbits,
    settled: last?.[0] ?? local.from,
  };
}

export function dayToDate(t: Days) {
  return new Date((t + 10_957.5) * 86_400_000);
}
