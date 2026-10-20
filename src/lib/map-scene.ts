import type { Status } from "@/generated/prisma/enums";
import {
  between,
  bodyPosition,
  daysSinceJ2000,
  distance,
  placements,
  routePosition,
  type BodySlug,
  type Days,
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
    agencies: { abbreviation: string; name: string }[];
  };
};

// Where the map can put a craft at a given time: on its route, at the body it
// sits at, or nowhere, because tracking ended (or never existed) while it
// was out in space.
export type Place =
  | { kind: "route"; position: Vec3 }
  | { kind: "body"; body: BodySlug }
  | { kind: "unknown"; since: Days | null };

export type Scene = {
  t: Days;
  earth: Vec3;
  bodies: { slug: BodySlug; position: Vec3; craft: MapCraft[] }[];
  free: { craft: MapCraft; position: Vec3 }[];
  unknown: { craft: MapCraft; since: Days | null }[];
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

export function placeCraft(
  craft: MapCraft,
  snapshot: PositionsSnapshot,
  t: Days,
): Place {
  const route = craft.horizonsId ? snapshot.routes[craft.horizonsId] : null;
  const onRoute = route && routePosition(route, t);

  if (onRoute) return { kind: "route", position: onRoute };

  const body = placements[craft.location];

  if (body) return { kind: "body", body };

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

export function buildScene(
  snapshot: PositionsSnapshot,
  craft: MapCraft[],
  t: Days,
): Scene {
  const atBody = new Map<BodySlug, MapCraft[]>();
  const free: Scene["free"] = [];
  const unknown: Scene["unknown"] = [];

  for (const one of craft) {
    const place = placeCraft(one, snapshot, t);

    if (place.kind === "route") {
      free.push({ craft: one, position: place.position });
    } else if (place.kind === "body") {
      atBody.set(place.body, [...(atBody.get(place.body) ?? []), one]);
    } else {
      unknown.push({ craft: one, since: place.since });
    }
  }

  const bodies = (Object.keys(snapshot.bodies) as BodySlug[]).map((slug) => ({
    slug,
    position: bodyPosition(snapshot, slug, t),
    craft: atBody.get(slug) ?? [],
  }));

  return {
    t,
    earth: bodyPosition(snapshot, "earth", t),
    bodies,
    free,
    unknown,
  };
}

const SUN: Vec3 = [0, 0, 0];
const KM_PER_AU = 149_597_870.7;
const LIGHT_SECONDS_PER_AU = 499.004784;

export function fromSun(position: Vec3) {
  return distance(position, SUN);
}

// "2.31 AU", "172 AU", or in kilometres when close: "1.5 million km".
export function formatDistance(au: number) {
  if (au < 0.1) {
    const km = au * KM_PER_AU;

    return km < 1e6
      ? `${Math.round(km / 1000).toLocaleString("en-GB")},000 km`
      : `${(km / 1e6).toFixed(1)} million km`;
  }

  return `${au < 10 ? au.toFixed(2) : Math.round(au).toLocaleString("en-GB")} AU`;
}

// How long a radio signal takes over that distance: "13 min", "23 h 47 min".
export function formatLightTime(au: number) {
  const minutes = Math.round((au * LIGHT_SECONDS_PER_AU) / 60);

  if (minutes < 1) return "under a minute";
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

export function dayToDate(t: Days) {
  return new Date((t + 10_957.5) * 86_400_000);
}
