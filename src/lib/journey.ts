import type { DatePrecision, MilestoneKind } from "@/generated/prisma/enums";
import {
  DWARF_PLANETS,
  PLANETS,
  routeSamples,
  type MapCraft,
  type Positions,
} from "@/lib/map-scene";
import {
  daysSinceJ2000,
  placements,
  routePosition,
  type BodySlug,
  type Days,
  type LocalPath,
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

// One part of a replay: the cruise between the planets, framed on the
// solar system, or the time around a body, framed on the body and following
// it as it moves. Each part takes `duration` milliseconds at normal speed.
export type Segment = {
  kind: "cruise" | "local";
  from: Days;
  until: Days;
  duration: number;
  // For the time around a body: which body, and whether the view turns
  // with the Sun–Earth line (a craft at L2).
  body: BodySlug | null;
  turn: boolean;
};

// A replay of a mission's journey, worked out from its routes and its paths
// around a body.
export type Journey = {
  mission: string;
  // The span the replay plays through. It ends today if the mission's
  // routes or paths run on past today.
  from: Days;
  until: Days;
  toToday: boolean;
  // Whether the replay begins well after launch, because Horizons only
  // tracks the craft from later on.
  lateStart: boolean;
  segments: Segment[];
  // The milestones in that span, marked along the scrubber.
  markers: { t: Days; title: string; date: string }[];
  // The asteroids and comets it went to, shown throughout so its flybys
  // and arrivals can be seen. (Planets are always shown.)
  bodies: BodySlug[];
  // What the camera frames for the cruise: the routes and the Sun, as
  // [minX, minY, maxX, maxY] in AU.
  bounds: [number, number, number, number];
};

// How long each part of a replay takes at normal speed, in milliseconds:
// the cruise and the time around a body get the same, except that a short
// time around a body (a lander's last days) gets less.
const PART_MS = 30_000;
const SHORT_PART_MS = 10_000;
const SHORT_PART_DAYS = 31;

// A route stops where the craft settles near the body it stays at, and a
// path around a body where the craft settles too close to see. The replay
// carries on to the first of these milestones after that, if there is one.
const ARRIVALS: MilestoneKind[] = ["ARRIVAL", "LANDING", "SAMPLE_RETURN"];

// A milestone this many days outside the replay (or a hundredth of its
// length, if more) is still marked, at that end: a route can start a day or
// two after launch, or stop a few days short of a landing.
const SLACK_DAYS = 5;

// A replay starting more than this many days after launch starts late. A
// path around Earth starting within it means the mission worked near Earth
// from the start (Gaia at L2), so its replay is that path alone.
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
// route or a loaded path around a body to replay.
export function planJourney(
  mission: string,
  craft: MapCraft[],
  positions: Positions,
  facts: JourneyFacts | undefined,
  today: Days,
): Journey | null {
  const members = craft.filter(
    (one) => one.mission.slug === mission && one.horizonsId,
  );
  const routes = members
    .map((one) => positions.routes[one.horizonsId!])
    .filter((route) => route && route.length > 1);
  const paths = [
    ...new Set(
      members
        .map((one) => positions.local?.[one.horizonsId!])
        .filter((path) => path !== undefined),
    ),
  ];

  if (routes.length === 0 && paths.length === 0) return null;

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

  const segments = parts(routes, paths, launch, today);

  if (segments.length === 0) return null;

  // Carry on to an arrival or landing after the routes and paths end.
  const last = segments[segments.length - 1];
  const arrival = milestones.find(
    ({ kind, t }) => ARRIVALS.includes(kind) && t > last.until,
  );

  last.until = Math.min(today, Math.max(last.until, arrival?.t ?? last.until));
  last.duration = partDuration(last);

  const from = segments[0].from;
  const until = last.until;
  const slack = Math.max(SLACK_DAYS, (until - from) / 100);

  return {
    mission,
    from,
    until,
    toToday: until === today,
    lateStart: launch !== null && from - launch > LATE_START_DAYS,
    segments,
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

function partDuration({ kind, from, until }: Segment) {
  return kind === "local" && until - from < SHORT_PART_DAYS
    ? SHORT_PART_MS
    : PART_MS;
}

// The parts of a replay: the cruise along the routes, then the time around
// the body the craft stayed at, from where the cruise ends. A mission that
// worked near Earth from launch has only its time there.
function parts(
  routes: RoutePoint[][],
  paths: LocalPath[],
  launch: Days | null,
  today: Days,
): Segment[] {
  const segments: Segment[] = [];
  const start = (launch ?? -Infinity) + LATE_START_DAYS;
  const nearEarthFromLaunch = paths.some(
    (path) => path.body === "earth" && path.from <= start,
  );
  const local = paths.length > 0 && {
    from: Math.min(...paths.map((path) => path.from)),
    until: Math.min(today, Math.max(...paths.map((path) => path.until))),
  };

  if (routes.length > 0 && !nearEarthFromLaunch) {
    const from = Math.min(...routes.map((route) => route[0][0]));
    const end = Math.max(...routes.map((route) => route[route.length - 1][0]));
    const until = Math.min(today, local ? Math.min(end, local.from) : end);

    if (until > from) {
      segments.push({
        kind: "cruise",
        from,
        until,
        duration: PART_MS,
        body: null,
        turn: false,
      });
    }
  }

  if (local) {
    const from = segments[0]?.until ?? local.from;

    if (local.until > from) {
      // The body the mission's first path is around: all of a mission's
      // craft stay at the same one.
      const first = paths.reduce((a, b) => (b.from < a.from ? b : a));
      const segment: Segment = {
        kind: "local",
        from,
        until: local.until,
        duration: PART_MS,
        body: first.body,
        turn: first.frame === "sun-earth",
      };

      segment.duration = partDuration(segment);
      segments.push(segment);
    }
  }

  return segments;
}

// How long the replay takes at normal speed, in milliseconds.
export function journeyLength(journey: Journey) {
  return journey.segments.reduce((sum, { duration }) => sum + duration, 0);
}

// The part of the replay time t falls in.
export function segmentAt(journey: Journey, t: Days) {
  const { segments } = journey;

  return segments.find(({ until }) => t < until) ?? segments.at(-1)!;
}

// The time the replay has reached after `elapsed` milliseconds of playing
// at normal speed, and back again. Within each part time runs evenly.
export function timeAt(journey: Journey, elapsed: number): Days {
  let start = 0;

  for (const segment of journey.segments) {
    if (elapsed <= start + segment.duration) {
      const k = Math.max(0, (elapsed - start) / segment.duration);

      return segment.from + (segment.until - segment.from) * k;
    }

    start += segment.duration;
  }

  return journey.until;
}

export function elapsedAt(journey: Journey, t: Days) {
  let start = 0;

  for (const segment of journey.segments) {
    if (t <= segment.until) {
      const k = Math.max(
        0,
        (t - segment.from) / (segment.until - segment.from),
      );

      return start + segment.duration * Math.min(1, k);
    }

    start += segment.duration;
  }

  return start;
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
