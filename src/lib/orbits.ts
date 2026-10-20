import type { DestinationSlug } from "../../prisma/data/destinations";

// Positions are in astronomical units (AU), measured from the Sun: x and y in
// the plane of Earth's orbit (the J2000 ecliptic), z above it. The map is
// drawn from above with x and y; distances use all three, since a craft such
// as Voyager 1 is far above that plane.
export type Vec3 = [x: number, y: number, z: number];

// Times are days since J2000.0, noon on 1 January 2000. Horizons works in TDB,
// which runs about a minute ahead of UTC; at the map's scale that is nothing.
export type Days = number;

// A body's orbit at one moment (its "osculating elements"): the ellipse it
// would follow from then on if only the Sun pulled on it. Other planets bend
// real orbits, so the snapshot holds a series of them, closer together where
// the orbit changes quickly, and positions come from the nearest two.
export type Elements = [
  epoch: Days,
  semiMajorAxis: number, // AU
  eccentricity: number,
  inclination: number, // degrees, as are the next three
  ascendingNode: number,
  argumentOfPerihelion: number,
  meanAnomaly: number, // at the epoch
  meanMotion: number, // degrees per day
];

// A point on a spacecraft's route: where the craft was and its velocity, in AU
// per day. Knowing the velocity at both ends lets positions in between follow
// the curve the craft was on.
export type RoutePoint = [
  t: Days,
  x: number,
  y: number,
  z: number,
  vx: number,
  vy: number,
  vz: number,
];

// public/positions.json, written by `npm run import:positions`.
export type PositionsSnapshot = {
  source: string;
  fetched: string;
  // The span the snapshot covers.
  from: Days;
  until: Days;
  // Every position between `from` and `until` here is within `nearKm` of
  // Horizons; the rest of the span is within `farKm`.
  accuracy: { from: Days; until: Days; nearKm: number; farKm: number };
  // "earth" holds the orbit of the Earth–Moon barycentre; bodyPosition adds
  // the Moon's pull to find Earth itself.
  bodies: Record<BodySlug, Elements[]>;
  // The Moon's orbit around Earth.
  moon: Elements[];
  // Keyed by Horizons ID. A route ends where tracking ended, or where the
  // craft arrived at the body it stays at.
  routes: Record<string, RoutePoint[]>;
};

// Where the map draws a craft whose location is this destination. Moons and
// craft in Earth orbit are drawn at the body they circle, since at the scale
// of the solar system they sit on top of it. null means the craft has no body
// to sit at and is drawn from its route.
export const placements = {
  "low-earth-orbit": "earth",
  "high-earth-orbit": "earth",
  "sun-earth-l2": "earth",
  moon: "earth",
  mercury: "mercury",
  venus: "venus",
  mars: "mars",
  jupiter: "jupiter",
  ganymede: "jupiter",
  europa: "jupiter",
  saturn: "saturn",
  titan: "saturn",
  uranus: "uranus",
  neptune: "neptune",
  pluto: "pluto",
  arrokoth: "arrokoth",
  ceres: "ceres",
  vesta: "vesta",
  psyche: "psyche",
  lutetia: "lutetia",
  ida: "ida",
  mathilde: "mathilde",
  eros: "eros",
  gaspra: "gaspra",
  steins: "steins",
  itokawa: "itokawa",
  donaldjohanson: "donaldjohanson",
  didymos: "didymos",
  dimorphos: "didymos",
  bennu: "bennu",
  dinkinesh: "dinkinesh",
  ryugu: "ryugu",
  halley: "halley",
  "tempel-1": "tempel-1",
  "grigg-skjellerup": "grigg-skjellerup",
  "67p-churyumov-gerasimenko": "67p-churyumov-gerasimenko",
  "wild-2": "wild-2",
  "hartley-2": "hartley-2",
  "heliocentric-orbit": null,
  "interstellar-space": null,
} as const satisfies Record<DestinationSlug, string | null>;

export type BodySlug = NonNullable<(typeof placements)[DestinationSlug]>;

// The Moon's share of the Earth–Moon mass. Earth sits this fraction of the
// Earth–Moon distance from their barycentre, on the side away from the Moon:
// up to 4,700 km, a few seconds of the Moon's pull.
export const MOON_SHARE = 0.0121505856;

const RADIANS = Math.PI / 180;

export function daysSinceJ2000(date: Date): Days {
  return date.getTime() / 86_400_000 - 10_957.5;
}

// Solves Kepler's equation, M = E - e sin E, for the eccentric anomaly E by
// Newton's method, with M between -pi and pi. For elongated orbits (Halley's
// is 0.97) it starts from the far end of the orbit on the same side as M,
// which always converges; starting on the wrong side can wander off.
function eccentricAnomaly(meanAnomaly: number, e: number) {
  let E = e > 0.8 ? (meanAnomaly < 0 ? -Math.PI : Math.PI) : meanAnomaly;

  for (let i = 0; i < 30; i++) {
    const step = (E - e * Math.sin(E) - meanAnomaly) / (1 - e * Math.cos(E));
    E -= step;
    if (Math.abs(step) < 1e-12) break;
  }

  return E;
}

// Where one set of elements puts the body at time t.
function positionFromElements(elements: Elements, t: Days): Vec3 {
  const [epoch, a, e, inclination, node, perihelion, M0, n] = elements;
  const M = ((((M0 + n * (t - epoch)) % 360) + 540) % 360) - 180;
  const E = eccentricAnomaly(M * RADIANS, e);

  // In the plane of the orbit, with x pointing to the perihelion.
  const px = a * (Math.cos(E) - e);
  const py = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // Turned into the ecliptic frame.
  const cw = Math.cos(perihelion * RADIANS);
  const sw = Math.sin(perihelion * RADIANS);
  const cn = Math.cos(node * RADIANS);
  const sn = Math.sin(node * RADIANS);
  const ci = Math.cos(inclination * RADIANS);
  const si = Math.sin(inclination * RADIANS);

  return [
    (cw * cn - sw * sn * ci) * px - (sw * cn + cw * sn * ci) * py,
    (cw * sn + sw * cn * ci) * px - (sw * sn - cw * cn * ci) * py,
    sw * si * px + cw * si * py,
  ];
}

// Index of the last item whose time is at or before t, or -1.
function lastAtOrBefore<T extends readonly number[]>(items: T[], t: Days) {
  let low = 0;
  let high = items.length - 1;
  let found = -1;

  while (low <= high) {
    const middle = (low + high) >> 1;

    if (items[middle][0] <= t) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return found;
}

// Where a series of orbits puts its body at time t. Between two orbits it
// blends the positions each gives, so the body moves smoothly instead of
// jumping when one orbit hands over to the next.
export function orbitPosition(series: Elements[], t: Days): Vec3 {
  const i = lastAtOrBefore(series, t);

  if (i === -1) return positionFromElements(series[0], t);
  if (i === series.length - 1) return positionFromElements(series[i], t);

  const before = series[i];
  const after = series[i + 1];
  const weight = (t - before[0]) / (after[0] - before[0]);
  const p = positionFromElements(before, t);
  const q = positionFromElements(after, t);

  return [
    p[0] + (q[0] - p[0]) * weight,
    p[1] + (q[1] - p[1]) * weight,
    p[2] + (q[2] - p[2]) * weight,
  ];
}

// Where a planet, asteroid or comet is at time t.
export function bodyPosition(
  snapshot: Pick<PositionsSnapshot, "bodies" | "moon">,
  body: BodySlug,
  t: Days,
): Vec3 {
  const position = orbitPosition(snapshot.bodies[body], t);

  if (body !== "earth") return position;

  const moon = orbitPosition(snapshot.moon, t);

  return [
    position[0] - MOON_SHARE * moon[0],
    position[1] - MOON_SHARE * moon[1],
    position[2] - MOON_SHARE * moon[2],
  ];
}

// Where a craft is at time t between two points on its route. A cubic curve
// that matches the position and velocity at both ends (Hermite
// interpolation, as in NASA's SPICE toolkit) follows the curve the craft was
// on, so a route needs far fewer points than straight lines would.
export function between(a: RoutePoint, b: RoutePoint, t: Days): Vec3 {
  const h = b[0] - a[0];
  const s = (t - a[0]) / h;
  const s2 = s * s;
  const s3 = s2 * s;
  const fromA = 2 * s3 - 3 * s2 + 1;
  const fromB = 3 * s2 - 2 * s3;
  const leavingA = (s3 - 2 * s2 + s) * h;
  const arrivingB = (s3 - s2) * h;

  return [1, 2, 3].map(
    (i) =>
      fromA * a[i] + leavingA * a[i + 3] + fromB * b[i] + arrivingB * b[i + 3],
  ) as Vec3;
}

// Where a craft is along its route at time t, or null outside the route.
export function routePosition(route: RoutePoint[], t: Days): Vec3 | null {
  const i = lastAtOrBefore(route, t);

  if (i === -1) return null;

  if (i === route.length - 1) {
    return t === route[i][0] ? [route[i][1], route[i][2], route[i][3]] : null;
  }

  return between(route[i], route[i + 1], t);
}

export function distance(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
