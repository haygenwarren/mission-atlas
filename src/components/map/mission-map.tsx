"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import MissionImage, { ImageCredit } from "@/components/mission-image";
import StatusBadge from "@/components/status-badge";
import type { DestinationKind, Status } from "@/generated/prisma/enums";
import { statusLabels } from "@/lib/missions";
import {
  MOON_NAMES,
  PLANETS,
  buildScene,
  dayToDate,
  formatDistance,
  formatLightTime,
  fromSun,
  placeCraft,
  routeSamples,
  type MapCraft,
  type Scene,
} from "@/lib/map-scene";
import {
  bodyPosition,
  daysSinceJ2000,
  distance,
  MOONS,
  isMoon,
  orbitOutline,
  type BodySlug,
  type MoonSlug,
  type PlaceSlug,
  type Days,
  type PositionsSnapshot,
  type Vec3,
} from "@/lib/orbits";
import {
  between,
  easeInOut,
  flight,
  easeOut,
  fitRadius,
  panBy,
  zoomAround,
  type Camera,
  type Size,
} from "./camera";
import {
  drawMap,
  type Box,
  type Hit,
  type Palette,
  type Target,
  type Trail,
} from "./draw";
import MissionList, {
  NO_FILTERS,
  matches,
  plain,
  statusDots,
  type Filters,
  type ListMission,
  type Where,
} from "./mission-list";

type Selection =
  | { kind: "mission"; slug: string }
  | { kind: "body"; slug: PlaceSlug };

type Data = {
  snapshot: PositionsSnapshot;
  orbits: { slug: BodySlug; points: Vec3[] }[];
  moonOrbits: { slug: MoonSlug; points: Vec3[] }[];
};

type Props = {
  craft: MapCraft[];
  // Display names of the bodies and of every place a craft can be.
  names: Record<string, string>;
  kinds: Record<string, DestinationKind>;
};

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

// How long one pulse around an active mission takes, in milliseconds.
const PULSE_MS = 2400;

// The view the map opens on: out to Jupiter.
const OPENING_RADIUS = 6;

// Safari reports a trackpad pinch as its own gesture events.
type GestureEvent = UIEvent & { scale: number; clientX: number; clientY: number };

const ORBITS: BodySlug[] = [...PLANETS, "pluto"];

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
  request: () => void;
};

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
// jumps there for visitors who ask for reduced motion.
function fly(v: View, to: Camera) {
  if (!v.camera) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    v.camera = to;
    v.request();
    return;
  }

  const trip = flight(v.camera, to, v.size);

  v.animation = {
    path: trip.at,
    to,
    start: performance.now(),
    duration: Math.min(2800, Math.max(1200, trip.duration)),
    ease: easeInOut,
  };
  v.request();
}

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "UTC",
});

// Theme colours, resolved to plain colours a canvas understands.
function readPalette(): Palette {
  const probe = document.createElement("span");

  document.body.appendChild(probe);

  const colour = (name: string) => {
    probe.style.color = `var(${name})`;
    return getComputedStyle(probe).color;
  };
  const root = getComputedStyle(document.documentElement);
  const palette = {
    background: colour("--background"),
    surface: colour("--surface"),
    foreground: colour("--foreground"),
    muted: colour("--muted"),
    border: colour("--border"),
    borderStrong: colour("--border-strong"),
    accent: colour("--accent"),
    active: colour("--status-active"),
    completed: colour("--status-completed"),
    failed: colour("--status-failed"),
    sans: `${root.getPropertyValue("--font-archivo")}, Arial, sans-serif`,
    mono: `${root.getPropertyValue("--font-plex-mono")}, monospace`,
  };

  probe.remove();

  return palette;
}

// A mission's routes, ready to draw.
function missionTrails(
  craft: MapCraft[],
  snapshot: PositionsSnapshot,
  mission: string,
): Trail[] {
  const ids = new Set(
    craft
      .filter((one) => one.mission.slug === mission && one.horizonsId)
      .map((one) => one.horizonsId!),
  );

  return [...ids]
    .map((id) => snapshot.routes[id])
    .filter((route) => route && route.length > 1)
    .map(routeSamples);
}

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
// outermost moon, or its near neighbourhood if it has none. A mission is
// shown with its surroundings, a quarter of its distance from the Sun across
// (at least 0.3 AU), or close enough to see a moon it is at apart from its
// planet. Null when nothing selected has a known position.
function focusOn(
  selection: Selection,
  craft: MapCraft[],
  snapshot: PositionsSnapshot,
  t: Days,
  size: Size,
  area: Box,
): Camera | null {
  const scene = buildScene(snapshot, craft, t);

  if (selection.kind === "body" && !isMoon(selection.slug)) {
    const body = scene.bodies.find(({ slug }) => slug === selection.slug);

    if (!body) return null;

    const around = scene.moons.filter(({ parent }) => parent === body.slug);
    const radius =
      around.length > 0
        ? Math.max(
            ...around.map(({ position }) => distance(position, body.position)),
          ) * 1.35
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
  snapshot: PositionsSnapshot,
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

function readSelection(
  craft: MapCraft[],
  snapshot: PositionsSnapshot,
): Selection | null {
  const params = new URLSearchParams(window.location.search);
  const mission = params.get("mission");
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
}: Props) {
  const names = useMemo(
    () => ({ ...MOON_NAMES, ...placeNames }),
    [placeNames],
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);

  const [data, setData] = useState<Data | null>(null);
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

  const selectedMission = selection?.kind === "mission" ? selection.slug : null;
  const hoveredMission =
    hovered?.kind === "craft"
      ? (craft.find(({ slug }) => slug === hovered.slug)?.mission.slug ?? null)
      : listHover;

  // Every mission, where it is now, and the ones the filters let through.
  const allRows = useMemo(
    () =>
      data && now !== null ? listMissions(craft, data.snapshot, now, names) : [],
    [craft, data, now, names],
  );
  const rows = useMemo(
    () => allRows.filter((row) => matches(row, filters)),
    [allRows, filters],
  );

  // The map shows only the missions the filters let through, and always the
  // selected one.
  const shown = useMemo(() => {
    if (!data) return craft;

    const slugs = new Set(rows.map(({ slug }) => slug));

    return craft.filter(
      ({ mission }) => slugs.has(mission.slug) || mission.slug === selectedMission,
    );
  }, [craft, data, rows, selectedMission]);

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

  const scene = useMemo(
    () => (data && now !== null ? buildScene(data.snapshot, shown, now) : null),
    [shown, data, now],
  );

  // Everything the drawing loop reads, refreshed after every render.
  const latest = useRef({
    craft: shown,
    names,
    data,
    hovered,
    hoveredMission,
    selection,
    trails,
    hoverTrails,
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
    };
    view.current.request();
  });

  // Load the positions, then pick up any selection in the address.
  useEffect(() => {
    let cancelled = false;

    fetch("/positions.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<PositionsSnapshot>;
      })
      .then((snapshot) => {
        if (cancelled) return;

        const today = daysSinceJ2000(new Date());

        setData({
          snapshot,
          // Fine enough that a planet sits on its orbit line even zoomed
          // in close enough to see its moons.
          orbits: ORBITS.map((slug) => ({
            slug,
            points: orbitOutline(snapshot.bodies[slug], today, 2048),
          })),
          moonOrbits: (Object.keys(MOONS) as MoonSlug[]).map((slug) => ({
            slug,
            points: orbitOutline(snapshot.moons[slug], today, 180),
          })),
        });
        setNow(today);

        const selected = readSelection(craft, snapshot);

        setSelection(selected);

        // A mission or place picked in the address, perhaps from a mission
        // page's "See where it is now": the map opens on its usual view,
        // then flies there, unless the visitor has started moving it.
        if (selected) {
          setTimeout(() => {
            const v = view.current;

            if (cancelled || v.moved || !v.camera) return;

            const target = focusOn(
              selected,
              craft,
              snapshot,
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
  }, [craft]);

  // The text in the info card moves on every 15 seconds; the map itself
  // redraws every second.
  useEffect(() => {
    const timer = setInterval(() => setNow(daysSinceJ2000(new Date())), 15_000);

    return () => clearInterval(timer);
  }, []);

  // Keep the address in step with the selection, so a selected mission can
  // be shared as a link.
  useEffect(() => {
    if (!data) return;

    const url = new URL(window.location.href);

    url.searchParams.delete("mission");
    url.searchParams.delete("body");

    if (selection) url.searchParams.set(selection.kind, selection.slug);

    window.history.replaceState(null, "", url);
  }, [data, selection]);

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

      if (!l.data || !l.palette) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      const scene = buildScene(
        l.data.snapshot,
        l.craft,
        daysSinceJ2000(new Date()),
      );

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

      v.scene = scene;
      v.hits = drawMap({
        ctx,
        size: v.size,
        camera: v.camera,
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
        // Markers along the bottom stay above the caption, however many
        // lines it wraps to.
        insets: {
          ...INSETS,
          bottom: caption
            ? Math.max(INSETS.bottom, height - caption.top + 6)
            : INSETS.bottom,
          left: list ? list.right + 14 : INSETS.left,
        },
        pulse: reducedMotion.matches ? null : (time % PULSE_MS) / PULSE_MS,
        covered: [controls, caption, list].filter((box) => box !== null),
      });

      // Keep the tooltip beside whatever it describes.
      const tip = tooltipRef.current;
      const hit =
        l.hovered &&
        v.hits.find(
          (one) => one.kind === l.hovered!.kind && one.slug === l.hovered!.slug,
        );

      if (tip) {
        if (hit) {
          // Below and to the right of the target, unless that would run off
          // the map.
          const left = hit.x + 260 > width ? hit.x - 254 : hit.x + 14;
          const top =
            hit.y + 14 + tip.offsetHeight > height
              ? hit.y - 14 - tip.offsetHeight
              : hit.y + 14;

          tip.style.transform = `translate(${left}px, ${top}px)`;
          tip.style.visibility = "visible";
        } else {
          tip.style.visibility = "hidden";
        }
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

  // The nearest target to (x, y), allowing `slack` extra pixels for a
  // finger. A label counts when the point is inside its box.
  function hitAt(x: number, y: number, slack = 0) {
    let best: Hit | null = null;
    let bestMiss = Infinity;

    for (const hit of view.current.hits) {
      const box = hit.box;
      const inBox =
        box &&
        x >= box.left - slack &&
        x <= box.right + slack &&
        y >= box.top - slack &&
        y <= box.bottom + slack;
      const miss = box
        ? inBox
          ? -0.5
          : Infinity
        : Math.hypot(hit.x - x, hit.y - y) - hit.radius - slack;

      if (miss <= 0 && miss < bestMiss) {
        best = hit;
        bestMiss = miss;
      }
    }

    return best;
  }

  function hover(x: number, y: number) {
    const hit = hitAt(x, y);
    const current = latest.current.hovered;

    canvasRef.current!.style.cursor = hit ? "pointer" : "grab";

    if (hit?.kind !== current?.kind || hit?.slug !== current?.slug) {
      setHovered(hit ? ({ kind: hit.kind, slug: hit.slug } as Target) : null);
    }
  }

  // Flies to what has just been selected, landing it in the open part of
  // the map.
  function flyTo(next: Selection) {
    const v = view.current;

    if (!data || !v.camera) return;

    const target = focusOn(
      next,
      craft,
      data.snapshot,
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
      const hit = hitAt(point.x, point.y, event.pointerType === "mouse" ? 0 : 14);

      // A marker for something out of view zooms out until it is in view;
      // for a craft, it also selects the mission.
      if (hit?.reach !== undefined) {
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
    else if (event.key === "Escape") closeCard();
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

      {data && (
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
        className={`absolute bottom-4 right-4 w-36 rounded-lg border border-border-strong bg-background/85 p-2 backdrop-blur ${selection ? "hidden sm:block" : ""}`}
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

      {scene && selection && (
        <InfoCard
          selection={selection}
          scene={scene}
          craft={craft}
          names={names}
          kinds={kinds}
          snapshot={data!.snapshot}
          onClose={closeCard}
        />
      )}

      {scene && (
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

function TooltipContent({
  target,
  scene,
  craft,
  names,
}: {
  target: Target;
  scene: Scene;
  craft: MapCraft[];
  names: Record<string, string>;
}) {
  if (target.kind === "body") {
    const body =
      scene.bodies.find(({ slug }) => slug === target.slug) ??
      scene.moons.find(({ slug }) => slug === target.slug);

    if (!body) return null;

    const count = new Set(body.craft.map(({ mission }) => mission.slug)).size;

    return (
      <>
        <p className="font-semibold">{names[body.slug]}</p>
        <p className="text-muted">
          {count === 0
            ? "No missions here"
            : `${count} mission${count === 1 ? "" : "s"} here`}
          {body.slug !== "earth" &&
            ` · ${formatDistance(distance(body.position, scene.earth))} from Earth`}
        </p>
      </>
    );
  }

  const one = craft.find(({ slug }) => slug === target.slug);
  const free = scene.free.find(({ craft: c }) => c.slug === target.slug);

  if (!one || !free) return null;

  return (
    <>
      <p className="font-semibold">{one.name}</p>
      {one.mission.name !== one.name && (
        <p className="text-muted">{one.mission.name}</p>
      )}
      <p className="text-muted">
        {formatDistance(fromSun(free.position))} from the Sun ·{" "}
        {formatDistance(distance(free.position, scene.earth))} from Earth
      </p>
    </>
  );
}

// Where a craft is, in words, with how far its signals travel.
function whereNow(
  one: MapCraft,
  scene: Scene,
  snapshot: PositionsSnapshot,
  names: Record<string, string>,
) {
  const place = placeCraft(one, snapshot, scene.t);

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
}: {
  selection: Selection;
  scene: Scene;
  craft: MapCraft[];
  names: Record<string, string>;
  kinds: Record<string, DestinationKind>;
  snapshot: PositionsSnapshot;
  onClose: () => void;
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
