"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import StatusBadge from "@/components/status-badge";
import {
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
  orbitOutline,
  type BodySlug,
  type Days,
  type PositionsSnapshot,
  type Vec3,
} from "@/lib/orbits";
import {
  between,
  easeInOut,
  easeOut,
  fitRadius,
  panBy,
  zoomAround,
  type Camera,
  type Size,
} from "./camera";
import { drawMap, type Hit, type Palette, type Target, type Trail } from "./draw";

type Selection =
  | { kind: "mission"; slug: string }
  | { kind: "body"; slug: BodySlug };

type Data = {
  snapshot: PositionsSnapshot;
  orbits: { slug: BodySlug; points: Vec3[] }[];
};

type Props = {
  craft: MapCraft[];
  // Display names of the bodies and of every place a craft can be.
  names: Record<string, string>;
};

// Views the buttons jump to: everything within `radius` AU of the Sun.
// "Everything" fits the farthest craft.
const VIEWS = [
  { label: "Inner planets", radius: 1.8 },
  { label: "To Jupiter", radius: 6 },
  { label: "Outer planets", radius: 33 },
  { label: "Everything", radius: null },
] as const;

// Room left at the edges of the map: the caption runs along the top.
const INSETS = { top: 40, bottom: 16, side: 18 };

// Wheel zoom speeds, per pixel of scroll. A trackpad pinch arrives as many
// small steps with ctrlKey set (in Chrome, Edge and Firefox), so it needs a
// faster rate than a mouse wheel's large steps.
const PINCH_RATE = 0.012;
const WHEEL_RATE = 0.002;
const LINE_RATE = 0.05;

// Safari reports a trackpad pinch as its own gesture events.
type GestureEvent = UIEvent & { scale: number; clientX: number; clientY: number };

const ORBITS: BodySlug[] = [...PLANETS, "pluto"];

// Camera and pointer state, changed many times a second, so kept in a ref
// rather than React state.
type View = {
  camera: Camera | null;
  animation: {
    from: Camera;
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
  request: () => void;
};

// Moves the camera smoothly from where it is to `to`.
function animate(
  v: View,
  to: Camera,
  duration: number,
  ease: (k: number) => number = easeInOut,
) {
  if (!v.camera) return;

  v.animation = { from: v.camera, to, start: performance.now(), duration, ease };
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

  if (body && body in snapshot.bodies) {
    return { kind: "body", slug: body as BodySlug };
  }

  return null;
}

export default function MissionMap({ craft, names }: Props) {
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

  const selectedMission = selection?.kind === "mission" ? selection.slug : null;
  const hoveredMission =
    hovered?.kind === "craft"
      ? (craft.find(({ slug }) => slug === hovered.slug)?.mission.slug ?? null)
      : null;

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
    () => (data && now !== null ? buildScene(data.snapshot, craft, now) : null),
    [craft, data, now],
  );

  // Everything the drawing loop reads, refreshed after every render.
  const latest = useRef({
    craft,
    names,
    data,
    hovered,
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
    request: () => {},
  });

  useEffect(() => {
    latest.current = {
      ...latest.current,
      craft,
      names,
      data,
      hovered,
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
          orbits: ORBITS.map((slug) => ({
            slug,
            points: orbitOutline(snapshot.bodies[slug], today),
          })),
        });
        setNow(today);
        setSelection(readSelection(craft, snapshot));
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

    function render(time: number) {
      frame = 0;

      const { width, height } = v.size;
      const l = latest.current;

      if (!width || !height || !v.camera) return;

      if (v.animation) {
        const a = v.animation;
        const k = Math.min(1, (time - a.start) / a.duration);

        v.camera = between(a.from, a.to, a.ease(k));
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

      v.scene = scene;
      v.hits = drawMap({
        ctx,
        size: v.size,
        camera: v.camera,
        scene,
        palette: l.palette,
        names: l.names,
        orbits: l.data.orbits,
        hovered: l.hovered,
        selectedMission:
          l.selection?.kind === "mission" ? l.selection.slug : null,
        selectedBody: l.selection?.kind === "body" ? l.selection.slug : null,
        trails: l.trails,
        hoverTrails: l.hoverTrails,
        insets: INSETS,
        covered: [controlsRef.current, captionRef.current].flatMap((element) => {
          const box = element?.getBoundingClientRect();
          const origin = wrap.getBoundingClientRect();

          return box && box.width > 0
            ? [
                {
                  left: box.left - origin.left - 4,
                  top: box.top - origin.top - 4,
                  right: box.right - origin.left + 4,
                  bottom: box.bottom - origin.top + 4,
                },
              ]
            : [];
        }),
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

      if (v.animation) request();
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
      v.camera ??= fitRadius(v.size, 6);
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

  function select(hit: Hit | null) {
    if (!hit) {
      setSelection(null);
    } else if (hit.kind === "body") {
      setSelection({ kind: "body", slug: hit.slug });
    } else {
      const one = craft.find(({ slug }) => slug === hit.slug);

      if (one) setSelection({ kind: "mission", slug: one.mission.slug });
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const v = view.current;
    const point = position(event);

    event.currentTarget.setPointerCapture(event.pointerId);
    v.pointers.set(event.pointerId, point);
    v.animation = null;

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
    else if (event.key === "Escape") setSelection(null);
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
        <p className="label-caps px-1.5 pb-1 text-muted">View</p>
        {VIEWS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => showView(preset.radius)}
            className="block w-full rounded px-1.5 py-1 text-left text-xs text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            {preset.label}
          </button>
        ))}
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
          snapshot={data!.snapshot}
          onClose={() => setSelection(null)}
        />
      )}

      {scene && (
        <p
          ref={captionRef}
          className="pointer-events-none absolute left-4 top-3 max-w-[calc(100%-2rem)] text-xs text-muted sm:max-w-md"
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
    const body = scene.bodies.find(({ slug }) => slug === target.slug);

    if (!body) return null;

    const count = body.craft.length;

    return (
      <>
        <p className="font-semibold">{names[body.slug]}</p>
        <p className="text-muted">
          {count === 0 ? "No craft here" : `${count} craft here`}
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

function InfoCard({
  selection,
  scene,
  craft,
  names,
  snapshot,
  onClose,
}: {
  selection: Selection;
  scene: Scene;
  craft: MapCraft[];
  names: Record<string, string>;
  snapshot: PositionsSnapshot;
  onClose: () => void;
}) {
  const members =
    selection.kind === "mission"
      ? craft.filter((one) => one.mission.slug === selection.slug)
      : (scene.bodies.find(({ slug }) => slug === selection.slug)?.craft ?? []);
  const title =
    selection.kind === "mission"
      ? members[0]?.mission.name
      : names[selection.slug];
  const ordered = [...members].sort(
    (a, b) =>
      Number(b.status === "ACTIVE") - Number(a.status === "ACTIVE") ||
      a.name.localeCompare(b.name),
  );
  const body =
    selection.kind === "body"
      ? scene.bodies.find(({ slug }) => slug === selection.slug)
      : null;
  const fromEarth =
    body && body.slug !== "earth" ? distance(body.position, scene.earth) : null;

  return (
    <aside className="absolute inset-x-0 bottom-0 max-h-[55%] overflow-y-auto rounded-t-xl border border-border bg-surface p-5 shadow-xl sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:max-h-[calc(100%-15rem)] sm:w-96 sm:rounded-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-caps text-muted">
            {selection.kind === "mission" ? "Mission" : "Craft here"}
          </p>
          <h2 className="font-display mt-1 text-xl">{title}</h2>
          {fromEarth !== null && (
            <p className="mt-1 text-sm text-muted">
              {formatDistance(fromEarth)} from Earth (
              {formatLightTime(fromEarth)} by radio)
            </p>
          )}
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

      {selection.kind === "body" && ordered.length === 0 && (
        <p className="mt-4 text-sm text-muted">No spacecraft are here.</p>
      )}

      <ul className="mt-4 space-y-4">
        {ordered.map((one) => (
          <li key={one.slug}>
            <div className="flex items-start justify-between gap-3">
              {selection.kind === "body" ? (
                <Link
                  href={`/missions/${one.mission.slug}`}
                  className="font-semibold hover:text-accent hover:underline"
                >
                  {one.name}
                </Link>
              ) : (
                <p className="font-semibold">{one.name}</p>
              )}
              <StatusBadge status={one.status} />
            </div>
            {selection.kind === "body" && one.mission.name !== one.name && (
              <p className="text-sm text-muted">{one.mission.name}</p>
            )}
            {selection.kind === "mission" ? (
              <p className="mt-1 text-sm">
                {whereNow(one, scene, snapshot, names)}
              </p>
            ) : (
              names[one.location] !== title && (
                <p className="mt-1 text-sm">{names[one.location]}</p>
              )
            )}
          </li>
        ))}
      </ul>

      {selection.kind === "mission" && (
        <Link
          href={`/missions/${selection.slug}`}
          className="mt-5 inline-block text-sm text-accent hover:underline"
        >
          Mission page →
        </Link>
      )}
    </aside>
  );
}
