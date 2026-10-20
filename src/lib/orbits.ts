import type { DestinationSlug } from "../../prisma/data/destinations";

// Positions are in astronomical units (AU), measured from the Sun in the
// plane of Earth's orbit (the J2000 ecliptic). The map is flat, so only x and
// y are kept.
export type Vec2 = [x: number, y: number];

// Times are days since J2000.0, noon on 1 January 2000. Horizons works in TDB,
// which runs about a minute ahead of UTC; at the map's scale that is nothing.
export type Days = number;

// A body's orbit at one moment (its "osculating elements"): the ellipse it
// would follow from then on if only the Sun pulled on it. Other planets bend
// real orbits, so the snapshot holds one set per year and positions are
// worked out from the nearest years.
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

// A point on a spacecraft's route.
export type RoutePoint = [t: Days, x: number, y: number];

// public/positions.json, written by `npm run import:positions`.
export type PositionsSnapshot = {
  source: string;
  fetched: string;
  // The span the snapshot covers.
  from: Days;
  until: Days;
  bodies: Record<BodySlug, Elements[]>;
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

const RADIANS = Math.PI / 180;

export function daysSinceJ2000(date: Date): Days {
  return date.getTime() / 86_400_000 - 10_957.5;
}

// Solves Kepler's equation, M = E - e sin E, for the eccentric anomaly E by
// Newton's method. Starting from pi converges for the most elongated comet
// orbits too.
function eccentricAnomaly(meanAnomaly: number, e: number) {
  let E = e > 0.8 ? Math.PI : meanAnomaly;

  for (let i = 0; i < 30; i++) {
    const step = (E - e * Math.sin(E) - meanAnomaly) / (1 - e * Math.cos(E));
    E -= step;
    if (Math.abs(step) < 1e-12) break;
  }

  return E;
}

// Where one set of elements puts the body at time t.
function positionFromElements(elements: Elements, t: Days): Vec2 {
  const [epoch, a, e, inclination, node, perihelion, M0, n] = elements;
  const M = ((((M0 + n * (t - epoch)) % 360) + 540) % 360) - 180;
  const E = eccentricAnomaly(M * RADIANS, e);

  // In the plane of the orbit, with x pointing to the perihelion.
  const px = a * (Math.cos(E) - e);
  const py = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // Turned into the ecliptic plane.
  const cw = Math.cos(perihelion * RADIANS);
  const sw = Math.sin(perihelion * RADIANS);
  const cn = Math.cos(node * RADIANS);
  const sn = Math.sin(node * RADIANS);
  const ci = Math.cos(inclination * RADIANS);

  return [
    (cw * cn - sw * sn * ci) * px - (sw * cn + cw * sn * ci) * py,
    (cw * sn + sw * cn * ci) * px - (sw * sn - cw * cn * ci) * py,
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

// Where a planet, asteroid or comet is at time t. Between two yearly sets of
// elements it blends the positions each gives, so bodies move smoothly
// instead of jumping when one year hands over to the next.
export function bodyPosition(series: Elements[], t: Days): Vec2 {
  const i = lastAtOrBefore(series, t);

  if (i === -1) return positionFromElements(series[0], t);
  if (i === series.length - 1) return positionFromElements(series[i], t);

  const before = series[i];
  const after = series[i + 1];
  const weight = (t - before[0]) / (after[0] - before[0]);
  const [x1, y1] = positionFromElements(before, t);
  const [x2, y2] = positionFromElements(after, t);

  return [x1 + (x2 - x1) * weight, y1 + (y2 - y1) * weight];
}

// Where a craft is at time t between two points on its route. Craft travel
// in curves around the Sun, so this moves around the Sun from one point to
// the other (distance and angle change evenly), not in a straight line. That
// way a route needs a few points per orbit instead of hundreds.
export function between(a: RoutePoint, b: RoutePoint, t: Days): Vec2 {
  const [t1, x1, y1] = a;
  const [t2, x2, y2] = b;
  const weight = (t - t1) / (t2 - t1);
  const r1 = Math.hypot(x1, y1);
  const r2 = Math.hypot(x2, y2);
  const angle1 = Math.atan2(y1, x1);
  let turn = Math.atan2(y2, x2) - angle1;

  // The shorter way round. The import keeps enough points that consecutive
  // ones are never more than half an orbit apart.
  if (turn > Math.PI) turn -= 2 * Math.PI;
  if (turn < -Math.PI) turn += 2 * Math.PI;

  const r = r1 + (r2 - r1) * weight;
  const angle = angle1 + turn * weight;

  return [r * Math.cos(angle), r * Math.sin(angle)];
}

// Where a craft is along its route at time t, or null outside the route.
export function routePosition(route: RoutePoint[], t: Days): Vec2 | null {
  const i = lastAtOrBefore(route, t);

  if (i === -1) return null;

  if (i === route.length - 1) {
    return t === route[i][0] ? [route[i][1], route[i][2]] : null;
  }

  return between(route[i], route[i + 1], t);
}
