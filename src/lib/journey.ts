import type { DatePrecision, MilestoneKind } from "@/generated/prisma/enums";
import { DWARF_PLANETS, PLANETS, routeSamples, type MapCraft } from "@/lib/map-scene";
import {
  daysSinceJ2000,
  placements,
  routePosition,
  type BodySlug,
  type Days,
  type PositionsSnapshot,
  type RoutePoint,
} from "@/lib/orbits";
import type { DestinationSlug } from "../../prisma/data/destinations";

// What the map knows about a mission's past, for replaying its journey: its
// launch, where it went and the milestones that have happened, from the
// database.
export type JourneyFacts = {
  launchDate: string;
  destinations: DestinationSlug[];
  milestones: {
    title: string;
    kind: MilestoneKind;
    date: string;
    precision: DatePrecision;
  }[];
};

// A replay of a mission's journey, worked out from its routes.
export type Journey = {
  mission: string;
  // The span the replay plays through. It ends today if the mission's
  // routes run on past today.
  from: Days;
  until: Days;
  toToday: boolean;
  // Whether the routes begin well after launch, because Horizons only
  // tracks the craft from later on.
  lateStart: boolean;
  // The milestones in that span, marked along the scrubber.
  markers: { t: Days; title: string; date: string }[];
  // The asteroids and comets it went to, shown throughout so its flybys
  // and arrivals can be seen. (Planets are always shown.)
  bodies: BodySlug[];
  // What the camera frames: the routes and the Sun, as [minX, minY, maxX,
  // maxY] in AU.
  bounds: [number, number, number, number];
};

// A route stops where the craft settles near the body it stays at, which
// for the giant planets is months before it arrives. The replay carries on
// to the first of these milestones after the route ends.
const ARRIVALS: MilestoneKind[] = ["ARRIVAL", "LANDING", "SAMPLE_RETURN"];

// A milestone this many days outside the replay (or a hundredth of its
// length, if more) is still marked, at that end: a route can start a day or
// two after launch, or stop a few days short of a landing.
const SLACK_DAYS = 5;

// Routes starting more than this many days after launch start late.
const LATE_START_DAYS = 30;

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

// The replay of a mission's journey, or null if none of its craft has a
// route to replay.
export function planJourney(
  mission: string,
  craft: MapCraft[],
  snapshot: PositionsSnapshot,
  facts: JourneyFacts | undefined,
  today: Days,
): Journey | null {
  const routes = craft
    .filter((one) => one.mission.slug === mission && one.horizonsId)
    .map((one) => snapshot.routes[one.horizonsId!])
    .filter((route) => route && route.length > 1);

  if (routes.length === 0) return null;

  const launch = facts ? daysSinceJ2000(new Date(facts.launchDate)) : null;
  const milestones = (facts?.milestones ?? []).map((milestone) => ({
    ...milestone,
    t: daysSinceJ2000(new Date(milestone.date)),
  }));

  // A mission whose milestones leave out its launch still shows it, as its
  // page does.
  if (
    launch !== null &&
    !milestones.some(
      ({ kind, t }) => kind === "LAUNCH" && Math.abs(t - launch) < 1,
    )
  ) {
    milestones.unshift({
      title: "Launch",
      kind: "LAUNCH",
      date: facts!.launchDate,
      precision: "DAY",
      t: launch,
    });
  }

  const from = Math.min(...routes.map((route) => route[0][0]));
  const routesEnd = Math.max(...routes.map((route) => route[route.length - 1][0]));
  const arrival = milestones.find(
    ({ kind, t }) => ARRIVALS.includes(kind) && t > routesEnd,
  );
  const until = Math.min(today, Math.max(routesEnd, arrival?.t ?? routesEnd));
  const slack = Math.max(SLACK_DAYS, (until - from) / 100);

  return {
    mission,
    from,
    until,
    toToday: until === today,
    lateStart: launch !== null && from - launch > LATE_START_DAYS,
    markers: milestones
      .filter(({ t }) => t >= from - slack && t <= until + slack)
      .sort((a, b) => a.t - b.t)
      .map(({ t, title, date, precision }) => ({
        t: Math.min(until, Math.max(from, t)),
        title,
        date: (precision === "MONTH" ? monthFormat : dayFormat).format(
          new Date(date),
        ),
      })),
    bodies: [
      ...new Set(
        (facts?.destinations ?? [])
          .map((slug) => placements[slug])
          .filter(
            (body): body is BodySlug =>
              body !== null &&
              !PLANETS.includes(body) &&
              !DWARF_PLANETS.includes(body),
          ),
      ),
    ],
    bounds: frame(routes, from, until),
  };
}

// Times along a route, close enough together to follow it, within the span.
function sampleTimes(route: RoutePoint[], from: Days, until: Days) {
  return routeSamples(route)
    .map(([t]) => t)
    .filter((t) => t >= from && t <= until);
}

// The corners of the box around the routes, up to `until`, and the Sun.
function frame(
  routes: RoutePoint[][],
  from: Days,
  until: Days,
): Journey["bounds"] {
  const bounds: Journey["bounds"] = [0, 0, 0, 0];

  for (const route of routes) {
    for (const t of sampleTimes(route, from, until)) {
      const [x, y] = routePosition(route, t)!;

      bounds[0] = Math.min(bounds[0], x);
      bounds[1] = Math.min(bounds[1], y);
      bounds[2] = Math.max(bounds[2], x);
      bounds[3] = Math.max(bounds[3], y);
    }
  }

  return bounds;
}
