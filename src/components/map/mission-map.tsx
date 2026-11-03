"use client";

import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import MissionImage, { ImageCredit } from "@/components/mission-image";
import StatusBadge from "@/components/status-badge";
import type { DestinationKind, Status } from "@/generated/prisma/enums";
import {
  planJourney,
  segmentAt,
  type Journey,
  type JourneyFacts,
  type Segment,
} from "@/lib/journey";
import { statusLabels } from "@/lib/missions";
import {
  MOON_NAMES,
  buildScene,
  dayToDate,
  earthAngle,
  formatDistance,
  formatLightTime,
  fromSun,
  moonAt,
  placeCraft,
  placeOnJourney,
  type LocalTrail,
  type MapCraft,
  type Positions,
  type Scene,
} from "@/lib/map-scene";
import {
  bodyPosition,
  daysSinceJ2000,
  distance,
  isMoon,
  type BodySlug,
  type PlaceSlug,
  type Days,
  type LocalIndex,
  type LocalPath,
  type Vec3,
} from "@/lib/orbits";
import {
  between,
  easeInOut,
  flight,
  easeOut,
  fitBounds,
  fitRadius,
  panBy,
  toScreen,
  zoomAround,
  type Camera,
  type Size,
} from "./camera";
import {
  SPLIT_PX,
  drawMap,
  type Box,
  type Hit,
  type Palette,
  type Target,
} from "./draw";
import {
  PULSE_MS,
  TooltipContent,
  hitAt,
  loadLocalIndex,
  loadLocalPath,
  loadPositions,
  missionLocalIds,
  missionLocalTrails,
  missionTrails,
  placeTooltip,
  readPalette,
  timeFormat,
  type MapData,
} from "./shared";
import MissionList, {
  NO_FILTERS,
  matches,
  plain,
  statusDots,
  type Filters,
  type ListMission,
  type Where,
} from "./mission-list";
import ReplayPlayer from "./replay-player";

type Selection =
  | { kind: "mission"; slug: string }
  | { kind: "body"; slug: PlaceSlug };

type Props = {
  craft: MapCraft[];
  // Display names of the bodies and of every place a craft can be.
  names: Record<string, string>;
  kinds: Record<string, DestinationKind>;
  // The milestones and destinations of each mission with a route to replay.
  journeys: Record<string, JourneyFacts>;
};

// A replay under way, and how long the player waits before it starts
// playing (while the camera flies there).
type Replay = { journey: Journey; delay: number };

// Views the buttons jump to: everything within `radius` AU of the Sun.
// "Everything" fits the farthest craft.
const VIEWS = [
  { label: "Inner planets", radius: 1.8 },
  { label: "To Jupiter", radius: 6 },
  { label: "Outer planets", radius: 33 },
  { label: "Everything", radius: null },
] as const;

// Room left at the edges of the map. The bottom grows to clear the caption.
const INSETS = { top: 18, bottom: 18, left: 18, right: 18 };

// Wheel zoom speeds, per pixel of scroll. A trackpad pinch arrives as many
// small steps with ctrlKey set (in Chrome, Edge and Firefox), so it needs a
// faster rate than a mouse wheel's large steps.
const PINCH_RATE = 0.012;
const WHEEL_RATE = 0.002;
const LINE_RATE = 0.05;

// The view the map opens on: out to Jupiter.
const OPENING_RADIUS = 6;

// Room kept clear along the bottom for the replay's player when framing a
// journey, in pixels.
const PLAYER_ROOM = 180;

// Safari reports a trackpad pinch as its own gesture events.
type GestureEvent = UIEvent & { scale: number; clientX: number; clientY: number };

// Camera and pointer state, changed many times a second, so kept in a ref
// rather than React state.
type View = {
  camera: Camera | null;
  // A move under way: the view part way along, for k from 0 to 1.
  animation: {
    path: (k: number) => Camera;
    to: Camera;
    start: number;
    duration: number;
    ease: (k: number) => number;
  } | null;
  size: Size;
  hits: Hit[];
  scene: Scene | null;
  pointers: Map<number, { x: number; y: number }>;
  downAt: { x: number; y: number } | null;
  dragged: boolean;
  // Whether the visitor has moved the view themselves.
  moved: boolean;
  // The view before the map flew in to a selection, to fly back to when its
  // card is closed.
  returnTo: Camera | null;
  // The time a replay has reached, the part of it being shown, and until
  // when it should hold still (performance.now() time) while the camera
  // flies to that part.
  replayT: Days | null;
  segment: Segment | null;
  holdUntil: number;
  // During a replay's time around a body, the view follows the body, and
  // `camera` is measured from it. For a craft at L2 the view also turns with
  // the Sun–Earth line, keeping the Sun where it was (`angle`, the line's
  // direction) when the view began following.
  anchor: { body: BodySlug; turn: boolean; angle: number } | null;
  request: () => void;
};

// The camera as the screen sees it at time t: the view's own, or while it
// follows a body, measured from where the body is then and turned with the
// Sun–Earth line.
function screenCamera(v: View, positions: Positions, t: Days): Camera | null {
  const camera = v.camera;

  if (!camera || !v.anchor) return camera;

  const [bx, by] = bodyPosition(positions, v.anchor.body, t);
  const turn = v.anchor.turn ? earthAngle(positions, t) - v.anchor.angle : 0;
  const c = Math.cos(turn);
  const s = Math.sin(turn);

  return {
    x: bx + c * camera.x - s * camera.y,
    y: by + s * camera.x + c * camera.y,
    scale: camera.scale,
    rotation: (camera.rotation ?? 0) + turn,
  };
}

// Moves the camera smoothly from where it is to `to`, at the visitor's
// request.
function animate(
  v: View,
  to: Camera,
  duration: number,
  ease: (k: number) => number = easeInOut,
) {
  if (!v.camera) return;

  const from = v.camera;

  v.moved = true;
  v.animation = {
    path: (k) => between(from, to, k),
    to,
    start: performance.now(),
    duration,
    ease,
  };
  v.request();
}

// Flies the camera to `to`, pulling back on the way for a long trip, or
// jumps there for visitors who ask for reduced motion. Returns how long the
// flight takes, in milliseconds.
function fly(v: View, to: Camera) {
  if (!v.camera) return 0;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    v.camera = to;
    v.request();
    return 0;
  }

  const trip = flight(v.camera, to, v.size);
  const duration = Math.min(2800, Math.max(1200, trip.duration));

  v.animation = {
    path: trip.at,
    to,
    start: performance.now(),
    duration,
    ease: easeInOut,
  };
  v.request();

  return duration;
}

// What the view frames for a replay's time around a body: the mission's
// paths there through that time, as [minX, minY, maxX, maxY] measured from
// the body, turned as the view will be (by `angle`, the Sun–Earth line's
// direction when the view began following), and the orbits it went round.
// Only as far out as the craft usually were: a path starts where the craft
// first counted as near (Cassini, 0.45 AU from Saturn), and the view should
// show the tour, with the craft flying in from its edge.
function localBounds(
  trails: LocalTrail[],
  segment: Segment,
  angle: number,
): [number, number, number, number] {
  const bounds: [number, number, number, number] = [0, 0, 0, 0];
  const add = (x: number, y: number) => {
    bounds[0] = Math.min(bounds[0], x);
    bounds[1] = Math.min(bounds[1], y);
    bounds[2] = Math.max(bounds[2], x);
    bounds[3] = Math.max(bounds[3], y);
  };

  for (const trail of trails) {
    if (trail.body !== segment.body) continue;

    const c = Math.cos(trail.turn ? angle : 0);
    const s = Math.sin(trail.turn ? angle : 0);
    const out = trail.reach * 1.5;

    for (const [t, u, w] of trail.points) {
      if (t >= segment.from && t <= segment.until && Math.hypot(u, w) <= out) {
        add(c * u - s * w, s * u + c * w);
      }
    }

    // An orbit reaches out to its apoapsis, a(1 + e).
    for (const [t, a, e] of trail.orbits) {
      if (t >= segment.from && t <= segment.until) {
        const far = Math.min(out, a * (1 + e));

        add(-far, -far);
        add(far, far);
      }
    }
  }

  return bounds;
}

// Frames one part of a replay at time t, flying the camera there: the
// routes for the cruise; for the time around a body, its paths there, with
// the view following the body from then on. Returns how long the flight
// takes, in milliseconds.
function showSegment(
  v: View,
  segment: Segment,
  journey: Journey,
  positions: Positions,
  trails: LocalTrail[],
  t: Days,
) {
  const { width, height } = v.size;
  const area = { left: 0, top: 0, right: width, bottom: height - PLAYER_ROOM };
  const here = screenCamera(v, positions, t);

  if (!here) return 0;

  if (segment.kind === "cruise" || !segment.body) {
    v.anchor = null;
    v.camera = here;
    return fly(v, fitBounds(v.size, area, journey.bounds));
  }

  const [bx, by] = bodyPosition(positions, segment.body, t);
  const angle = earthAngle(positions, t);

  v.anchor = { body: segment.body, turn: segment.turn, angle };
  v.camera = { ...here, x: here.x - bx, y: here.y - by };

  return fly(v, fitBounds(v.size, area, localBounds(trails, segment, angle)));
}

// Sets up a replay of a mission's journey and flies the camera to frame its
// first part above the player. Null if the mission has nothing to replay.
function prepareReplay(
  v: View,
  mission: string,
  craft: MapCraft[],
  positions: Positions,
  index: LocalIndex | null,
  journeys: Record<string, JourneyFacts>,
): Replay | null {
  const journey = planJourney(
    mission,
    craft,
    positions,
    journeys[mission],
    daysSinceJ2000(new Date()),
  );

  if (!journey || !v.camera) return null;

  const segment = journey.segments[0];
  const trails = missionLocalTrails(craft, positions, index, mission);

  v.replayT = journey.from;
  v.segment = segment;
  v.returnTo ??= v.camera;

  // A short pause after the flight before it starts playing.
  return {
    journey,
    delay:
      showSegment(v, segment, journey, positions, trails, journey.from) + 400,
  };
}

// The paths a replay of a mission needs: its craft's, and the Moon's (in
// Horizons, 301) for one near Earth.
function replayIds(
  craft: MapCraft[],
  mission: string,
  index: LocalIndex | null,
) {
  const ids = missionLocalIds(craft, index, mission);
  const nearEarth = ids.some((id) => index?.craft[id]?.body === "earth");

  return nearEarth && index?.craft["301"] ? [...ids, "301"] : ids;
}

// Loads the paths around a body of the given craft, and returns them with
// the ones loaded before.
async function withLocal(
  ids: string[],
  loaded: Record<string, LocalPath>,
): Promise<Record<string, LocalPath>> {
  const paths = await Promise.all(ids.map(loadLocalPath));
  const result = { ...loaded };

  ids.forEach((id, i) => {
    const path = paths[i];

    if (path) result[id] = path;
  });

  return result;
}

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "UTC",
});

// A view centred on (x, y) in `area` of the screen (the part not covered by
// the list and the info card), showing `radius` AU around it.
function viewAt(x: number, y: number, radius: number, size: Size, area: Box) {
  const { scale } = fitRadius(
    { width: area.right - area.left, height: area.bottom - area.top },
    radius,
  );

  return {
    x: x - ((area.left + area.right) / 2 - size.width / 2) / scale,
    y: y + ((area.top + area.bottom) / 2 - size.height / 2) / scale,
    scale,
  };
}

// How close a planet's view comes in when it has no moons on the map: a
// fiftieth of its distance from the Sun each way (Venus: 2 million km).
const PLANET_VIEW = 0.02;

// A view of where the selected mission's craft, or the selected body, are
// now. A planet (or asteroid or comet) is shown up close: out to its
// outermost moon and the craft circling it, or its near neighbourhood if it
// has neither. A mission placed around its planet is shown with the planet;
// otherwise with its surroundings, a quarter of its distance from the Sun
// across (at least 0.3 AU), or close enough to see a moon it is at apart
// from its planet. Null when nothing selected has a known position.
function focusOn(
  selection: Selection,
  craft: MapCraft[],
  snapshot: Positions,
  index: LocalIndex | null,
  t: Days,
  size: Size,
  area: Box,
): Camera | null {
  const scene = buildScene(snapshot, craft, t);

  // A mission with craft placed around their body: the body, out to the
  // furthest of them or the way their paths usually reach, whichever is
  // more (JWST with Earth and the Moon, Juno with Jupiter).
  const near = scene.local.filter(
    ({ craft: one }) =>
      selection.kind === "mission" && one.mission.slug === selection.slug,
  );

  if (near.length > 0) {
    const body = scene.bodies.find(({ slug }) => slug === near[0].body)!;
    const radius = Math.max(
      ...near.map(({ craft: one, offset }) =>
        Math.max(
          Math.hypot(offset[0], offset[1]),
          snapshot.local?.[one.horizonsId!]?.reach ?? 0,
        ),
      ),
    );

    return viewAt(body.position[0], body.position[1], radius * 1.3, size, area);
  }

  if (selection.kind === "body" && !isMoon(selection.slug)) {
    const body = scene.bodies.find(({ slug }) => slug === selection.slug);

    if (!body) return null;

    // Out to its outermost moon, and to where craft circling it now
    // usually reach (JWST at L2, Hope at Mars).
    const reaches = [
      ...scene.moons
        .filter(({ parent }) => parent === body.slug)
        .map(({ position }) => distance(position, body.position)),
      ...Object.entries(index?.craft ?? {})
        .filter(
          ([id, entry]) =>
            entry.body === body.slug &&
            t >= entry.from &&
            t <= entry.until &&
            craft.some(({ horizonsId }) => horizonsId === id),
        )
        .map(([, entry]) => entry.reach),
    ];
    const radius =
      reaches.length > 0
        ? Math.max(...reaches) * 1.35
        : fromSun(body.position) * PLANET_VIEW;

    return viewAt(body.position[0], body.position[1], radius, size, area);
  }

  const holds = (here: MapCraft[]) =>
    here.some(({ mission }) => mission.slug === selection.slug);
  const moons = scene.moons.filter((moon) =>
    selection.kind === "body" ? moon.slug === selection.slug : holds(moon.craft),
  );
  const positions = [
    ...(selection.kind === "body"
      ? scene.bodies.filter(({ slug }) => slug === selection.slug)
      : [
          ...scene.free.filter(({ craft: one }) => one.mission.slug === selection.slug),
          ...scene.bodies.filter(({ craft: here }) => holds(here)),
        ]
    ).map(({ position }) => position),
    ...moons.map(({ position }) => position),
  ];

  if (positions.length === 0) return null;

  const xs = positions.map(([x]) => x);
  const ys = positions.map(([, y]) => y);
  const x = (Math.min(...xs) + Math.max(...xs)) / 2;
  const y = (Math.min(...ys) + Math.max(...ys)) / 2;
  const spread = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  );
  // A moon is shown close enough in to see it apart from its planet.
  const moonReach = Math.max(
    0,
    ...moons.map(
      ({ position, parent }) =>
        distance(
          position,
          scene.bodies.find(({ slug }) => slug === parent)!.position,
        ) * 1.4,
    ),
  );
  const radius =
    moons.length > 0
      ? Math.max(spread * 0.7, moonReach)
      : Math.max(
          spread * 0.7,
          Math.min(40, Math.max(0.3, Math.hypot(x, y) * 0.25)),
        );
  return viewAt(x, y, radius, size, area);
}

// The part of the map not covered by the list or the info card, where a
// flight should land its target. On phones the card covers the bottom half.
function openArea(
  v: View,
  list: HTMLElement | null,
  wrap: HTMLElement | null,
): Box {
  const { width, height } = v.size;

  if (width < 640) {
    return { left: 0, top: 0, right: width, bottom: height * 0.45 };
  }

  const box = list?.getBoundingClientRect();
  const origin = wrap?.getBoundingClientRect();
  const left = box && origin && box.width > 0 ? box.right - origin.left : 0;

  return { left, top: 0, right: width - 416, bottom: height };
}

// The list rows: every mission, with where its craft are now, active first.
function listMissions(
  craft: MapCraft[],
  snapshot: Positions,
  t: Days,
  names: Record<string, string>,
): ListMission[] {
  const missions = new Map<string, MapCraft[]>();

  for (const one of craft) {
    missions.set(one.mission.slug, [
      ...(missions.get(one.mission.slug) ?? []),
      one,
    ]);
  }

  return [...missions.values()]
    .map((members) => {
      const mission = members[0].mission;
      const places = new Set<Where>();
      const where = new Set<string>();

      for (const one of [...members].sort(byActivity)) {
        const place = placeCraft(one, snapshot, t);

        if (place.kind === "route") {
          places.add("flight");
          where.add(
            `In flight · ${formatDistance(fromSun(place.position))} from the Sun`,
          );
        } else if (place.kind === "body") {
          places.add(place.body === "earth" ? "earth" : "body");
          where.add(names[one.location] ?? names[place.body]);
        } else {
          places.add("unknown");
          where.add(
            one.status === "ACTIVE"
              ? "Waiting for tracking data"
              : "Position unknown",
          );
        }
      }

      return {
        slug: mission.slug,
        name: mission.name,
        status: mission.status,
        agencies: mission.agencies.map(({ abbreviation }) => abbreviation),
        where: [...where].join(", "),
        places: [...places],
        text: plain(
          [
            mission.name,
            ...members.map(({ name }) => name),
            ...mission.agencies.flatMap(({ abbreviation, name }) => [
              abbreviation,
              name,
            ]),
          ].join(" "),
        ),
      };
    })
    .sort(byActivity);
}

// What the address asks for: a mission or place to select, and whether to
// replay the mission's journey ("?replay=voyager-1").
function readSelection(
  craft: MapCraft[],
  snapshot: Positions,
): Selection | null {
  const params = new URLSearchParams(window.location.search);
  const mission = params.get("replay") ?? params.get("mission");
  const body = params.get("body");

  if (mission && craft.some((one) => one.mission.slug === mission)) {
    return { kind: "mission", slug: mission };
  }

  if (body && (body in snapshot.bodies || isMoon(body))) {
    return { kind: "body", slug: body as PlaceSlug };
  }

  return null;
}

export default function MissionMap({
  craft,
  names: placeNames,
  kinds,
  journeys,
}: Props) {
  const names = useMemo<Record<string, string>>(
    () => ({ ...MOON_NAMES, ...placeNames }),
    [placeNames],
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<MapData | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState<Days | null>(null);
  const [hovered, setHovered] = useState<Target | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  // A mission hovered in the list.
  const [listHover, setListHover] = useState<string | null>(null);
  // The list starts open on wide screens and folded on narrower ones, until
  // the visitor opens or hides it.
  const [panel, setPanel] = useState<"auto" | "open" | "closed">("auto");
  const panelRef = useRef<HTMLElement>(null);
  const [replay, setReplay] = useState<Replay | null>(null);
  // Which craft have a path around a body (public/local), the paths loaded
  // so far, and the ones asked for.
  const [localIndex, setLocalIndex] = useState<LocalIndex | null>(null);
  const [local, setLocal] = useState<Record<string, LocalPath>>({});
  const requested = useRef(new Set<string>());

  // What the map places things with: the snapshot and the paths loaded.
  const positions = useMemo<Positions | null>(
    () => (data ? { ...data.snapshot, local } : null),
    [data, local],
  );

  const selectedMission = selection?.kind === "mission" ? selection.slug : null;
  const hoveredMission =
    hovered?.kind === "craft"
      ? (craft.find(({ slug }) => slug === hovered.slug)?.mission.slug ?? null)
      : listHover;

  // Every mission, where it is now, and the ones the filters let through.
  const allRows = useMemo(
    () =>
      positions && now !== null
        ? listMissions(craft, positions, now, names)
        : [],
    [craft, positions, now, names],
  );
  const rows = useMemo(
    () => allRows.filter((row) => matches(row, filters)),
    [allRows, filters],
  );

  // The map shows only the missions the filters let through, and always the
  // selected one. A replay shows only its own mission.
  const shown = useMemo(() => {
    if (!data) return craft;

    if (replay) {
      return craft.filter(({ mission }) => mission.slug === replay.journey.mission);
    }

    const slugs = new Set(rows.map(({ slug }) => slug));

    return craft.filter(
      ({ mission }) => slugs.has(mission.slug) || mission.slug === selectedMission,
    );
  }, [craft, data, rows, selectedMission, replay]);

  const agencies = useMemo(
    () =>
      [
        ...new Map(
          craft.flatMap(({ mission }) =>
            mission.agencies.map((agency) => [agency.abbreviation, agency]),
          ),
        ).values(),
      ].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation)),
    [craft],
  );

  // The selected mission's routes, drawn in full, and the hovered mission's,
  // drawn faintly.
  const trails = useMemo(
    () =>
      data && selectedMission
        ? missionTrails(craft, data.snapshot, selectedMission)
        : [],
    [craft, data, selectedMission],
  );
  const hoverTrails = useMemo(
    () =>
      data && hoveredMission && hoveredMission !== selectedMission
        ? missionTrails(craft, data.snapshot, hoveredMission)
        : [],
    [craft, data, hoveredMission, selectedMission],
  );

  // The same for their paths around a body, once loaded.
  const localTrails = useMemo(
    () =>
      positions && selectedMission
        ? missionLocalTrails(craft, positions, localIndex, selectedMission)
        : [],
    [craft, positions, localIndex, selectedMission],
  );
  const hoverLocalTrails = useMemo(
    () =>
      positions && hoveredMission && hoveredMission !== selectedMission
        ? missionLocalTrails(craft, positions, localIndex, hoveredMission)
        : [],
    [craft, positions, localIndex, hoveredMission, selectedMission],
  );

  const scene = useMemo(
    () =>
      positions && now !== null ? buildScene(positions, shown, now) : null,
    [shown, positions, now],
  );

  // Everything the drawing loop reads, refreshed after every render.
  const latest = useRef({
    craft: shown,
    names,
    data,
    positions,
    hovered,
    hoveredMission,
    selection,
    trails,
    hoverTrails,
    localTrails,
    hoverLocalTrails,
    localIndex,
    replay,
    palette: null as Palette | null,
  });

  const view = useRef<View>({
    camera: null,
    animation: null,
    size: { width: 0, height: 0 },
    hits: [],
    scene: null,
    pointers: new Map(),
    downAt: null,
    dragged: false,
    moved: false,
    returnTo: null,
    replayT: null,
    segment: null,
    holdUntil: 0,
    anchor: null,
    request: () => {},
  });

  useEffect(() => {
    latest.current = {
      ...latest.current,
      craft: shown,
      names,
      data,
      hovered,
      hoveredMission,
      selection,
      trails,
      hoverTrails,
      localTrails,
      hoverLocalTrails,
      localIndex,
      positions,
      replay,
    };
    view.current.request();
  });

  // Fetches the paths around a body of the given craft, once each.
  const requestLocal = useEffectEvent((ids: string[]) => {
    for (const id of ids) {
      if (requested.current.has(id)) continue;

      requested.current.add(id);
      loadLocalPath(id).then((path) => {
        if (path) setLocal((loaded) => ({ ...loaded, [id]: path }));
      });
    }
  });

  // A selected mission's paths around a body are drawn in full.
  useEffect(() => {
    if (selectedMission) {
      requestLocal(missionLocalIds(craft, localIndex, selectedMission));
    }
  }, [craft, localIndex, selectedMission]);

  // Load the positions, then pick up any selection in the address.
  useEffect(() => {
    let cancelled = false;

    Promise.all([loadPositions(), loadLocalIndex()])
      .then(([{ data: loaded, today }, index]) => {
        if (cancelled) return;

        const { snapshot } = loaded;

        setData(loaded);
        setNow(today);
        setLocalIndex(index);

        const selected = readSelection(craft, snapshot);
        const replaying = new URLSearchParams(window.location.search).has(
          "replay",
        );

        setSelection(selected);

        // A mission or place picked in the address, perhaps from a mission
        // page's "See where it is now": the map opens on its usual view,
        // then flies there, unless the visitor has started moving it. Asked
        // to replay a mission's journey, it starts the replay instead.
        if (selected) {
          setTimeout(async () => {
            // A mission's paths around a body, to frame it by.
            const paths =
              selected.kind === "mission"
                ? await withLocal(
                    replaying
                      ? replayIds(craft, selected.slug, index)
                      : missionLocalIds(craft, index, selected.slug),
                    {},
                  )
                : {};
            const withPaths = { ...snapshot, local: paths };
            const v = view.current;

            if (cancelled || v.moved || !v.camera) return;

            setLocal((current) => ({ ...current, ...paths }));

            const next =
              replaying && selected.kind === "mission"
                ? prepareReplay(
                    v,
                    selected.slug,
                    craft,
                    withPaths,
                    index,
                    journeys,
                  )
                : null;

            if (next) {
              setReplay(next);
              return;
            }

            const target = focusOn(
              selected,
              craft,
              withPaths,
              index,
              today,
              v.size,
              openArea(v, panelRef.current, wrapRef.current),
            );

            if (target) {
              v.returnTo ??= v.camera;
              fly(v, target);
            }
          }, 600);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [craft, journeys]);

  // The text in the info card moves on every 15 seconds; the map itself
  // redraws every second.
  useEffect(() => {
    const timer = setInterval(() => setNow(daysSinceJ2000(new Date())), 15_000);

    return () => clearInterval(timer);
  }, []);

  // Keep the address in step with the selection, so a selected mission (or
  // its replay) can be shared as a link.
  useEffect(() => {
    if (!data) return;

    const url = new URL(window.location.href);

    url.searchParams.delete("mission");
    url.searchParams.delete("body");
    url.searchParams.delete("replay");

    if (replay) url.searchParams.set("replay", replay.journey.mission);
    else if (selection) url.searchParams.set(selection.kind, selection.slug);

    window.history.replaceState(null, "", url);
  }, [data, selection, replay]);

  // The drawing loop: draws a frame when something has changed, and keeps
  // going while the view is moving.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    const v = view.current;
    let frame = 0;

    latest.current.palette = readPalette();

    // Visitors who ask their system for less motion get no pulse.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function render(time: number) {
      frame = 0;

      const { width, height } = v.size;
      const l = latest.current;

      if (!width || !height || !v.camera) return;

      if (v.animation) {
        const a = v.animation;
        const k = Math.min(1, (time - a.start) / a.duration);

        v.camera = a.path(a.ease(k));
        if (k >= 1) v.animation = null;
      }

      const dpr = window.devicePixelRatio || 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!l.data || !l.positions || !l.palette) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      // Where everything is now, or during a replay, where it was at the
      // time the replay has reached, seen from wherever the view is.
      const t = l.replay
        ? (v.replayT ?? l.replay.journey.from)
        : daysSinceJ2000(new Date());
      const scene = buildScene(
        l.positions,
        l.craft,
        t,
        l.replay ? placeOnJourney : placeCraft,
      );
      const camera = screenCamera(v, l.positions, t)!;

      // Where the controls and caption sit over the map, in its own
      // coordinates; labels keep clear of them.
      const origin = wrap.getBoundingClientRect();
      const overlay = (element: HTMLElement | null) => {
        const box = element?.getBoundingClientRect();

        return box && box.width > 0
          ? {
              left: box.left - origin.left - 4,
              top: box.top - origin.top - 4,
              right: box.right - origin.left + 4,
              bottom: box.bottom - origin.top + 4,
            }
          : null;
      };
      const controls = overlay(controlsRef.current);
      const caption = overlay(captionRef.current);
      const list = overlay(panelRef.current);
      const player = overlay(playerRef.current);
      // What sits along the bottom of the map: the caption, or the player.
      const bottom = player ?? caption;

      v.scene = scene;
      v.hits = drawMap({
        ctx,
        size: v.size,
        camera,
        scene,
        palette: l.palette,
        names: l.names,
        orbits: l.data.orbits,
        moonOrbits: l.data.moonOrbits,
        hovered: l.hovered,
        hoveredMission: l.hoveredMission,
        selectedMission:
          l.selection?.kind === "mission" ? l.selection.slug : null,
        selectedBody: l.selection?.kind === "body" ? l.selection.slug : null,
        trails: l.trails,
        hoverTrails: l.hoverTrails,
        localTrails: l.localTrails,
        hoverLocalTrails: l.hoverLocalTrails,
        // Markers along the bottom stay above the caption or the player,
        // however tall they are.
        insets: {
          ...INSETS,
          bottom: bottom
            ? Math.max(INSETS.bottom, height - bottom.top + 6)
            : INSETS.bottom,
          left: list ? list.right + 14 : INSETS.left,
        },
        pulse: reducedMotion.matches ? null : (time % PULSE_MS) / PULSE_MS,
        // Close in around a body, markers for the planets out of view would
        // only clutter the edges.
        edges: v.anchor ? 0 : 1,
        covered: [controls, caption, list, player].filter((box) => box !== null),
        smallBodies: l.replay?.journey.bodies,
      });

      placeTooltip(tooltipRef.current, v.hits, l.hovered, v.size);

      // Craft near a body now, far enough out on screen to be drawn apart
      // from it at this zoom: fetch their paths, so they can be.
      if (!l.replay && l.localIndex) {
        const wanted = Object.entries(l.localIndex.craft).filter(
          ([id, entry]) => {
            const reach = entry.reach * camera.scale;
            const body = scene.bodies.find(({ slug }) => slug === entry.body);

            if (
              !body ||
              l.positions!.local?.[id] ||
              t < entry.from ||
              t > entry.until ||
              reach < SPLIT_PX ||
              !l.craft.some(({ horizonsId }) => horizonsId === id)
            ) {
              return false;
            }

            const [x, y] = toScreen(
              camera,
              v.size,
              body.position[0],
              body.position[1],
            );

            return (
              x > -reach &&
              y > -reach &&
              x < width + reach &&
              y < height + reach
            );
          },
        );

        if (wanted.length > 0) requestLocal(wanted.map(([id]) => id));
      }

      // Keep drawing while the view moves or the pulse runs.
      if (v.animation || !reducedMotion.matches) request();
    }

    function request() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    v.request = request;

    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;

      v.size = { width, height };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      v.camera ??= fitRadius(v.size, OPENING_RADIUS);
      render(performance.now());
    });

    resize.observe(wrap);

    // Redraw in the other theme's colours when it changes.
    const theme = new MutationObserver(() => {
      latest.current.palette = readPalette();
      request();
    });

    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // Positions move on in real time.
    const tick = setInterval(request, 1000);

    // Wheel zoom has to stop the page scrolling, which needs a listener
    // React cannot add.
    function onWheel(event: WheelEvent) {
      event.preventDefault();

      if (!v.camera) return;

      const rect = canvas.getBoundingClientRect();
      const base = v.animation?.to ?? v.camera;
      const rate = event.ctrlKey
        ? PINCH_RATE
        : event.deltaMode === 1
          ? LINE_RATE
          : WHEEL_RATE;
      const factor = Math.exp(-event.deltaY * rate);

      animate(
        v,
        zoomAround(
          base,
          v.size,
          factor,
          event.clientX - rect.left,
          event.clientY - rect.top,
        ),
        180,
        easeOut,
      );
    }

    // Safari's pinch: `scale` is how far the fingers have spread since the
    // gesture began, so each change zooms by the step since the last one.
    let lastScale = 1;

    function onGestureStart(event: Event) {
      event.preventDefault();
      lastScale = 1;
    }

    function onGestureChange(event: Event) {
      const gesture = event as GestureEvent;

      event.preventDefault();

      if (!v.camera) return;

      const rect = canvas.getBoundingClientRect();

      v.animation = null;
      v.moved = true;
      v.camera = zoomAround(
        v.camera,
        v.size,
        gesture.scale / lastScale,
        gesture.clientX - rect.left,
        gesture.clientY - rect.top,
      );
      lastScale = gesture.scale;
      request();
    }

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("gesturestart", onGestureStart);
    canvas.addEventListener("gesturechange", onGestureChange);
    canvas.addEventListener("gestureend", onGestureStart);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      theme.disconnect();
      clearInterval(tick);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("gesturestart", onGestureStart);
      canvas.removeEventListener("gesturechange", onGestureChange);
      canvas.removeEventListener("gestureend", onGestureStart);
      v.request = () => {};
    };
  }, []);

  function animateTo(
    to: Camera,
    duration: number,
    ease: (k: number) => number = easeInOut,
  ) {
    animate(view.current, to, duration, ease);
  }

  function zoomBy(factor: number) {
    const v = view.current;

    if (!v.camera) return;

    animateTo(
      zoomAround(
        v.animation?.to ?? v.camera,
        v.size,
        factor,
        v.size.width / 2,
        v.size.height / 2,
      ),
      250,
      easeOut,
    );
  }

  function showView(radius: number | null) {
    const v = view.current;
    const reach =
      radius ??
      Math.max(
        ...(v.scene?.free ?? []).map(({ position }) =>
          Math.hypot(position[0], position[1]),
        ),
        40,
      ) * 1.05;

    animateTo(fitRadius(v.size, reach), 900);
  }

  function position(event: React.PointerEvent | React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();

    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  // Nothing is hovered or selected during a replay.
  function hover(x: number, y: number) {
    const hit = replay ? null : hitAt(view.current.hits, x, y);
    const current = latest.current.hovered;

    canvasRef.current!.style.cursor = hit ? "pointer" : "grab";

    if (hit?.kind !== current?.kind || hit?.slug !== current?.slug) {
      setHovered(hit ? ({ kind: hit.kind, slug: hit.slug } as Target) : null);
    }
  }

  // Flies to what has just been selected, landing it in the open part of
  // the map. A mission's paths around a body are loaded first, so a craft
  // there is framed with its surroundings.
  async function flyTo(next: Selection) {
    const v = view.current;

    if (!data || !v.camera) return;

    const paths =
      next.kind === "mission"
        ? await withLocal(missionLocalIds(craft, localIndex, next.slug), local)
        : local;
    const target = focusOn(
      next,
      craft,
      { ...data.snapshot, local: paths },
      localIndex,
      daysSinceJ2000(new Date()),
      v.size,
      openArea(v, panelRef.current, wrapRef.current),
    );

    if (target) {
      v.returnTo ??= v.camera;
      fly(v, target);
    }
  }

  // Closing the card flies back to the view from before the map flew in to
  // what was selected.
  function closeCard() {
    const v = view.current;

    setSelection(null);

    if (v.returnTo) {
      fly(v, v.returnTo);
      v.returnTo = null;
    }
  }

  // Replays the selected mission's journey: the player takes over the
  // bottom of the map, and everything else steps aside. Its paths around a
  // body are loaded first.
  async function startReplay(mission: string) {
    if (!data) return;

    const paths = await withLocal(
      replayIds(craft, mission, localIndex),
      local,
    );
    const next = prepareReplay(
      view.current,
      mission,
      craft,
      { ...data.snapshot, local: paths },
      localIndex,
      journeys,
    );

    setLocal((current) => ({ ...current, ...paths }));

    if (next) {
      setReplay(next);
      setHovered(null);
      setListHover(null);
    }
  }

  // The replay has reached time t: the map moves on with it, and when t
  // passes into another part, flies to frame that part, holding the replay
  // still meanwhile.
  function replayAt(t: Days) {
    const v = view.current;

    if (!replay || !positions) return;

    v.replayT = t;

    const segment = segmentAt(replay.journey, t);

    if (segment !== v.segment) {
      v.segment = segment;
      v.holdUntil =
        performance.now() +
        showSegment(v, segment, replay.journey, positions, localTrails, t);
    }

    v.request();
  }

  // Ending the replay flies back to where the mission is now, once the
  // list and card are back in place. The keyboard focus goes back to the
  // map.
  function stopReplay() {
    const v = view.current;

    // The view stops following a body, from where the screen shows it now.
    if (positions && v.replayT !== null) {
      v.animation = null;
      v.camera = screenCamera(v, positions, v.replayT);
    }

    v.anchor = null;
    v.segment = null;
    v.replayT = null;
    v.holdUntil = 0;
    setReplay(null);

    requestAnimationFrame(() => {
      if (selection) flyTo(selection);
      canvasRef.current?.focus();
    });
  }

  // Where the replayed mission is at time t, in words: how far it is from
  // the Sun and Earth while it flies, or the body it has reached.
  function describeAt(t: Days) {
    if (!positions || !replay) return "";

    const members = craft
      .filter(({ mission }) => mission.slug === replay.journey.mission)
      .sort(byActivity);

    for (const one of members) {
      const place = placeOnJourney(one, positions!, t);
      const earth = bodyPosition(positions!, "earth", t);

      if (place.kind === "route") {
        return `${formatDistance(fromSun(place.position))} from the Sun · ${formatDistance(distance(place.position, earth))} from Earth`;
      }

      if (place.kind === "body" && place.offset) {
        const [dx, dy, dz] = place.offset;
        const away = `${formatDistance(Math.hypot(dx, dy, dz))} from ${names[place.body]}`;

        if (place.body !== "earth") return away;

        const moon = moonAt(positions!, "moon", t);
        const here: Vec3 = [earth[0] + dx, earth[1] + dy, earth[2] + dz];

        return `${away} · ${formatDistance(distance(here, moon))} from the Moon`;
      }

      if (place.kind === "body") return `At ${names[place.moon ?? place.body]}`;
    }

    return "";
  }

  // Clicking a craft selects its mission. Clicking a planet, asteroid or
  // comet selects it and flies in close, out to its moons if it has any; a
  // moon is already close, so selecting one stays put.
  function select(hit: Hit | null) {
    if (!hit) {
      setSelection(null);
      view.current.returnTo = null;
    } else if (hit.kind === "body") {
      const next: Selection = { kind: "body", slug: hit.slug };

      setSelection(next);

      if (!isMoon(hit.slug)) flyTo(next);
    } else {
      const one = craft.find(({ slug }) => slug === hit.slug);

      if (one) setSelection({ kind: "mission", slug: one.mission.slug });
    }
  }

  // Choosing a mission in the list selects it and flies to it. On phones the
  // list, which covers the map, folds away first.
  function selectFromList(slug: string) {
    const v = view.current;
    const next: Selection = { kind: "mission", slug };

    setSelection(next);
    setListHover(null);

    if (v.size.width < 640) setPanel("auto");

    flyTo(next);
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const v = view.current;
    const point = position(event);

    event.currentTarget.setPointerCapture(event.pointerId);
    v.pointers.set(event.pointerId, point);
    v.animation = null;
    v.moved = true;

    if (v.pointers.size === 1) {
      v.downAt = point;
      v.dragged = false;
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const v = view.current;
    const point = position(event);
    const previous = v.pointers.get(event.pointerId);

    if (!previous || !v.camera) {
      if (event.pointerType === "mouse") hover(point.x, point.y);
      return;
    }

    if (v.pointers.size === 2) {
      // Pinch: zoom by how far the fingers moved apart, and pan with them.
      const other = [...v.pointers.entries()].find(
        ([id]) => id !== event.pointerId,
      )![1];
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(point.x - other.x, point.y - other.y);
      const midBefore = {
        x: (previous.x + other.x) / 2,
        y: (previous.y + other.y) / 2,
      };
      const midAfter = { x: (point.x + other.x) / 2, y: (point.y + other.y) / 2 };

      v.camera = panBy(
        zoomAround(v.camera, v.size, after / before, midBefore.x, midBefore.y),
        midAfter.x - midBefore.x,
        midAfter.y - midBefore.y,
      );
      v.dragged = true;
    } else {
      // A press that hardly moves is a click, not a drag.
      const start = v.downAt ?? point;

      if (!v.dragged && Math.hypot(point.x - start.x, point.y - start.y) < 4) {
        return;
      }

      v.dragged = true;
      v.camera = panBy(v.camera, point.x - previous.x, point.y - previous.y);
      event.currentTarget.style.cursor = "grabbing";
    }

    v.pointers.set(event.pointerId, point);
    v.request();
  }

  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    const v = view.current;
    const point = position(event);

    v.pointers.delete(event.pointerId);

    if (v.pointers.size > 0) return;

    if (!v.dragged) {
      const hit = hitAt(
        v.hits,
        point.x,
        point.y,
        event.pointerType === "mouse" ? 0 : 14,
      );

      // A marker for something out of view zooms out until it is in view;
      // for a craft, it also selects the mission. During a replay the map
      // only pans and zooms.
      if (replay) {
        // Nothing to select.
      } else if (hit?.reach !== undefined) {
        animateTo(fitRadius(v.size, hit.reach * 1.12), 900);
        if (hit.kind === "craft") select(hit);
      } else {
        select(hit);
      }
    }

    v.downAt = null;
    v.dragged = false;

    if (event.pointerType === "mouse") hover(point.x, point.y);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    const v = view.current;
    const step = 80;
    const pans: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };

    if (event.key === "+" || event.key === "=") zoomBy(1.5);
    else if (event.key === "-") zoomBy(1 / 1.5);
    else if (event.key === "Escape") {
      if (replay) stopReplay();
      else closeCard();
    }
    else if (pans[event.key] && v.camera) {
      animateTo(panBy(v.animation?.to ?? v.camera, ...pans[event.key]), 200, easeOut);
    } else return;

    event.preventDefault();
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="img"
        aria-label="Map of the solar system showing where each spacecraft is now. Drag to pan, scroll or pinch to zoom, and use the arrow and plus and minus keys."
        className="absolute inset-0 h-full w-full cursor-grab touch-none outline-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => {
          if (view.current.pointers.size === 0) setHovered(null);
        }}
        onDoubleClick={(event) => {
          const v = view.current;
          const { x, y } = position(event);

          if (v.camera) {
            animateTo(zoomAround(v.camera, v.size, 2, x, y), 300, easeOut);
          }
        }}
        onKeyDown={onKeyDown}
      />

      {!data && (
        <p className="absolute inset-0 grid place-items-center text-muted">
          {failed ? "The positions could not be loaded." : "Loading positions…"}
        </p>
      )}

      {data && !replay && (
        <>
          <MissionList
            rows={rows}
            total={allRows.length}
            filters={filters}
            onFilters={setFilters}
            agencies={agencies}
            selected={selectedMission}
            onHover={setListHover}
            onSelect={selectFromList}
            onHide={() => {
              setPanel("closed");
              setListHover(null);
            }}
            panelRef={panelRef}
            className={`inset-4 sm:right-auto sm:bottom-12 sm:w-80 ${
              { auto: "hidden lg:flex", open: "flex", closed: "hidden" }[panel]
            }`}
          />
          <button
            type="button"
            onClick={() => setPanel("open")}
            className={`label-caps absolute left-4 top-4 rounded-lg border border-border-strong bg-background/85 px-3 py-2 text-muted backdrop-blur transition-colors hover:border-accent hover:text-foreground ${
              { auto: "lg:hidden", open: "hidden", closed: "" }[panel]
            }`}
          >
            Missions
          </button>
        </>
      )}

      <div
        ref={tooltipRef}
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-0 w-60 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm shadow-lg"
      >
        {scene && hovered && (
          <TooltipContent
            target={hovered}
            scene={scene}
            craft={craft}
            names={names}
          />
        )}
      </div>

      <div
        ref={controlsRef}
        className={`absolute bottom-4 right-4 w-36 rounded-lg border border-border-strong bg-background/85 p-2 backdrop-blur ${replay ? "hidden" : selection ? "hidden sm:block" : ""}`}
      >
        <p className="label-caps px-0.5 pb-1.5 text-muted">View</p>
        <div className="space-y-1.5">
          {VIEWS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => showView(preset.radius)}
              className="block w-full rounded border border-border-strong px-2 py-1 text-left text-xs text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2 border-t border-border pt-2">
          {[
            { label: "Zoom out", text: "−", factor: 1 / 1.6 },
            { label: "Zoom in", text: "+", factor: 1.6 },
          ].map((button) => (
            <button
              key={button.label}
              type="button"
              aria-label={button.label}
              onClick={() => zoomBy(button.factor)}
              className="h-8 flex-1 rounded border border-border-strong text-lg leading-none text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>

      {scene && selection && !replay && (
        <InfoCard
          selection={selection}
          scene={scene}
          craft={craft}
          names={names}
          kinds={kinds}
          snapshot={positions!}
          onClose={closeCard}
          // A mission can replay with a route between the planets, or a
          // path around one (JWST has only that).
          onReplay={
            selectedMission &&
            (trails.length > 0 ||
              missionLocalIds(craft, localIndex, selectedMission).length > 0)
              ? () => startReplay(selectedMission)
              : undefined
          }
        />
      )}

      {replay && (
        <ReplayPlayer
          key={replay.journey.mission}
          ref={playerRef}
          journey={replay.journey}
          name={
            craft.find(({ mission }) => mission.slug === replay.journey.mission)
              ?.mission.name ?? ""
          }
          labels={replay.journey.segments.map((segment) =>
            segment.kind === "cruise" ? "Cruise" : `At ${names[segment.body!]}`,
          )}
          describe={describeAt}
          delay={replay.delay}
          holding={() => performance.now() < view.current.holdUntil}
          onTime={replayAt}
          onClose={stopReplay}
        />
      )}

      {scene && !replay && (
        <p
          ref={captionRef}
          className={`pointer-events-none absolute bottom-3 left-4 right-44 text-xs text-muted sm:right-auto sm:max-w-md ${selection ? "hidden sm:block" : ""}`}
        >
          Positions for {timeFormat.format(dayToDate(scene.t))} UTC, from JPL
          Horizons. Not to scale.
        </p>
      )}
    </div>
  );
}

// Where a craft is, in words, with how far its signals travel.
function whereNow(
  one: MapCraft,
  scene: Scene,
  snapshot: Positions,
  names: Record<string, string>,
) {
  const place = placeCraft(one, snapshot, scene.t);
  const local =
    place.kind === "body" &&
    scene.local.find(({ craft: c }) => c.slug === one.slug);

  // Near a body, placed around it: how far from it, and from Earth (or for
  // a craft near Earth, from the Moon).
  if (place.kind === "body" && local) {
    const where = names[one.location] ?? names[place.body];
    const fromBody = formatDistance(Math.hypot(...local.offset));
    const fromEarth = distance(local.position, scene.earth);
    const radio = `(${formatLightTime(fromEarth)} by radio)`;

    if (place.body === "earth") {
      const moon = scene.moons.find(({ slug }) => slug === "moon")!.position;

      return `${where}, ${fromBody} from Earth ${radio} and ${formatDistance(distance(local.position, moon))} from the Moon`;
    }

    const prefix = where === names[place.body] ? "" : `${where}, `;

    return `${prefix}${fromBody} from ${names[place.body]}, ${formatDistance(fromEarth)} from Earth ${radio}`;
  }

  if (place.kind === "route") {
    const fromEarth = distance(place.position, scene.earth);

    return `${formatDistance(fromSun(place.position))} from the Sun, ${formatDistance(fromEarth)} from Earth (${formatLightTime(fromEarth)} by radio)`;
  }

  if (place.kind === "body") {
    const where = names[one.location] ?? names[place.body];

    if (place.body === "earth") return where;

    const fromEarth = distance(
      bodyPosition(snapshot, place.body, scene.t),
      scene.earth,
    );

    return `${where}, ${formatDistance(fromEarth)} from Earth (${formatLightTime(fromEarth)} by radio)`;
  }

  const since = place.since === null ? null : dayFormat.format(dayToDate(place.since));

  if (one.status === "ACTIVE") {
    return `Waiting for newer tracking data${since ? ` (last position ${since})` : ""}`;
  }

  return `Position unknown${since ? ` since ${since}` : ""}`;
}

// What kind of place a body is, for the label above its name.
const kindLabels: Partial<Record<DestinationKind, string>> = {
  PLANET: "Planet",
  DWARF_PLANET: "Dwarf planet",
  MOON: "Moon",
  ASTEROID: "Asteroid",
  COMET: "Comet",
};

// Active first, then by name.
function byActivity<T extends { name: string; status: Status }>(a: T, b: T) {
  return (
    Number(b.status === "ACTIVE") - Number(a.status === "ACTIVE") ||
    a.name.localeCompare(b.name)
  );
}

// The card beside the map, the same for a mission and for a place: what it
// is, its name, then the details.
function Card({
  label,
  title,
  detail,
  onClose,
  children,
}: {
  label: string;
  title: string;
  detail?: string | null;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside className="absolute inset-x-0 bottom-0 max-h-[55%] overflow-y-auto rounded-t-xl border border-border bg-surface p-5 shadow-xl sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:max-h-[calc(100%-17rem)] sm:w-96 sm:rounded-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-caps text-muted">{label}</p>
          <h2 className="font-display mt-1 text-xl">{title}</h2>
          {detail && <p className="mt-1 text-sm text-muted">{detail}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg px-2 text-xl text-muted hover:text-foreground"
        >
          ×
        </button>
      </div>
      {children}
    </aside>
  );
}

function InfoCard({
  selection,
  scene,
  craft,
  names,
  kinds,
  snapshot,
  onClose,
  onReplay,
}: {
  selection: Selection;
  scene: Scene;
  craft: MapCraft[];
  names: Record<string, string>;
  kinds: Record<string, DestinationKind>;
  snapshot: Positions;
  onClose: () => void;
  // Starts a replay of the mission's journey, when it has a route.
  onReplay?: () => void;
}) {
  if (selection.kind === "mission") {
    const members = craft
      .filter((one) => one.mission.slug === selection.slug)
      .sort(byActivity);
    const mission = members[0]?.mission;

    return (
      <Card label="Mission" title={mission?.name} onClose={onClose}>
        {mission?.imageUrl && (
          <figure className="mt-4">
            <MissionImage
              src={mission.imageUrl}
              sizes="(min-width: 640px) 344px, 100vw"
              className="aspect-[3/2] rounded-lg"
            />
            <figcaption>
              <ImageCredit mission={mission} className="mt-1.5" />
            </figcaption>
          </figure>
        )}
        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-button px-4 py-2 text-sm font-medium text-button-text transition-opacity hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
              <path d="M7 4.5v15L19.5 12z" />
            </svg>
            Replay its journey
          </button>
        )}
        <ul className="mt-4 space-y-4">
          {members.map((one) => (
            <li key={one.slug}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{one.name}</p>
                <StatusBadge status={one.status} />
              </div>
              <p className="mt-1 text-sm">
                {whereNow(one, scene, snapshot, names)}
              </p>
            </li>
          ))}
        </ul>
        <Link
          href={`/missions/${selection.slug}`}
          className="mt-5 inline-block text-sm text-accent hover:underline"
        >
          Mission page →
        </Link>
      </Card>
    );
  }

  const place = selection.slug;
  const body =
    scene.bodies.find(({ slug }) => slug === place) ??
    scene.moons.find(({ slug }) => slug === place);
  const fromEarth =
    body && body.slug !== "earth" ? distance(body.position, scene.earth) : null;
  // A planet's card also lists the missions at each of its moons.
  const moons = isMoon(place)
    ? []
    : scene.moons.filter(
        ({ parent, craft: here }) => parent === place && here.length > 0,
      );

  return (
    <Card
      label={
        isMoon(place) ? "Moon" : (kindLabels[kinds[place]] ?? "Planet")
      }
      title={names[place]}
      detail={
        fromEarth === null
          ? null
          : `${formatDistance(fromEarth)} from Earth (${formatLightTime(fromEarth)} by radio)`
      }
      onClose={onClose}
    >
      <p className="label-caps mt-5 text-muted">Craft here</p>
      <MissionGroups here={body?.craft ?? []} title={names[place]} names={names} />

      {moons.map((moon) => (
        <div key={moon.slug}>
          <p className="label-caps mt-6 text-muted">
            At {moon.slug === "moon" ? "the Moon" : names[moon.slug]}
          </p>
          <MissionGroups here={moon.craft} title={names[moon.slug]} names={names} />
        </div>
      ))}
    </Card>
  );
}

// The craft at a place, one entry per mission with its craft beneath it.
function MissionGroups({
  here,
  title,
  names,
}: {
  here: MapCraft[];
  title: string;
  names: Record<string, string>;
}) {
  const missions = [
    ...new Map(here.map(({ mission }) => [mission.slug, mission])).values(),
  ].sort(byActivity);

  if (missions.length === 0) {
    return <p className="mt-2 text-sm text-muted">No spacecraft are here.</p>;
  }

  return (
    <ul className="mt-3 space-y-4">
      {missions.map((mission) => {
        const members = here
          .filter((one) => one.mission.slug === mission.slug)
          .sort(byActivity);
        // A mission with one craft here, named like the mission, needs no
        // list: only where it is, if that is more exact than the place.
        const lone = members.length === 1 && members[0].name === mission.name;

        return (
          <li key={mission.slug}>
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/missions/${mission.slug}`}
                className="font-semibold hover:text-accent hover:underline"
              >
                {mission.name}
              </Link>
              <StatusBadge status={mission.status} />
            </div>

            {lone ? (
              names[members[0].location] !== title && (
                <p className="mt-1 text-sm text-muted">
                  {names[members[0].location]}
                </p>
              )
            ) : (
              <ul className="mt-1.5 space-y-1">
                {members.map((one) => (
                  <li
                    key={one.slug}
                    className="flex items-center gap-2 text-sm text-muted"
                  >
                    <span
                      aria-hidden
                      className={`h-2 w-2 shrink-0 rounded-full ${statusDots[one.status]}`}
                    />
                    <span>
                      <span className="text-foreground">{one.name}</span>
                      {names[one.location] !== title &&
                        ` · ${names[one.location]}`}
                      <span className="sr-only">
                        , {statusLabels[one.status]}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
