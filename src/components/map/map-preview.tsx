"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MOON_NAMES,
  buildScene,
  dayToDate,
  type MapCraft,
  type Scene,
} from "@/lib/map-scene";
import { daysSinceJ2000 } from "@/lib/orbits";
import { fitRadius, type Camera, type Size } from "./camera";
import { drawMap, type Hit, type Palette, type Target } from "./draw";
import {
  PULSE_MS,
  TooltipContent,
  hitAt,
  loadPositions,
  missionTrails,
  placeTooltip,
  readPalette,
  timeFormat,
  type MapData,
} from "./shared";

type Props = {
  craft: MapCraft[];
  // Display names of the bodies and of every place a craft can be.
  names: Record<string, string>;
};

// How far out from the Sun the map shows, in AU: past Jupiter's orbit, or
// just the inner planets on a phone.
const RADIUS = 5.6;
const NARROW_RADIUS = 1.8;

const INSETS = { top: 18, bottom: 18, left: 18, right: 18 };

// The home page's map: where every craft is now, with tooltips and a faint
// route on hover, but no panning or zooming, so scrolling the page never gets
// caught by it. Clicking a craft or a planet opens the full map with it
// selected.
export default function MapPreview({ craft, names: placeNames }: Props) {
  const router = useRouter();
  const names = useMemo(
    () => ({ ...MOON_NAMES, ...placeNames }),
    [placeNames],
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);

  const [data, setData] = useState<MapData | null>(null);
  const [failed, setFailed] = useState(false);
  const [scene, setScene] = useState<Scene | null>(null);
  const [hovered, setHovered] = useState<Target | null>(null);

  const hoveredMission =
    hovered?.kind === "craft"
      ? (craft.find(({ slug }) => slug === hovered.slug)?.mission.slug ?? null)
      : null;
  const hoverTrails = useMemo(
    () =>
      data && hoveredMission
        ? missionTrails(craft, data.snapshot, hoveredMission)
        : [],
    [craft, data, hoveredMission],
  );

  // Everything the drawing loop reads, refreshed after every render.
  const latest = useRef({
    craft,
    names,
    data,
    hovered,
    hoveredMission,
    hoverTrails,
    palette: null as Palette | null,
  });

  const view = useRef({
    camera: null as Camera | null,
    size: { width: 0, height: 0 } as Size,
    hits: [] as Hit[],
    request: () => {},
  });

  useEffect(() => {
    latest.current = {
      ...latest.current,
      craft,
      names,
      data,
      hovered,
      hoveredMission,
      hoverTrails,
    };
    view.current.request();
  });

  useEffect(() => {
    let cancelled = false;

    loadPositions()
      .then(({ data: loaded, today }) => {
        if (cancelled) return;

        setData(loaded);
        setScene(buildScene(loaded.snapshot, craft, today));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [craft]);

  // The tooltip's text and the caption move on every 15 seconds; the map
  // itself redraws every second.
  useEffect(() => {
    if (!data) return;

    const timer = setInterval(
      () => setScene(buildScene(data.snapshot, craft, daysSinceJ2000(new Date()))),
      15_000,
    );

    return () => clearInterval(timer);
  }, [craft, data]);

  // The drawing loop: draws a frame when something has changed, and keeps
  // the pulse going while the map is on screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    const v = view.current;
    let frame = 0;
    let onScreen = true;

    latest.current.palette = readPalette();

    // Visitors who ask their system for less motion get no pulse.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function render(time: number) {
      frame = 0;

      const { width, height } = v.size;
      const l = latest.current;

      if (!width || !height || !v.camera) return;

      const dpr = window.devicePixelRatio || 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!l.data || !l.palette) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      const origin = wrap.getBoundingClientRect();
      const box = captionRef.current?.getBoundingClientRect();
      const caption = box
        ? {
            left: box.left - origin.left - 4,
            top: box.top - origin.top - 4,
            right: box.right - origin.left + 4,
            bottom: box.bottom - origin.top + 4,
          }
        : null;

      v.hits = drawMap({
        ctx,
        size: v.size,
        camera: v.camera,
        scene: buildScene(l.data.snapshot, l.craft, daysSinceJ2000(new Date())),
        palette: l.palette,
        names: l.names,
        orbits: l.data.orbits,
        moonOrbits: l.data.moonOrbits,
        hovered: l.hovered,
        hoveredMission: l.hoveredMission,
        selectedMission: null,
        selectedBody: null,
        trails: [],
        hoverTrails: l.hoverTrails,
        insets: {
          ...INSETS,
          bottom: caption
            ? Math.max(INSETS.bottom, height - caption.top + 6)
            : INSETS.bottom,
        },
        pulse: reducedMotion.matches ? null : (time % PULSE_MS) / PULSE_MS,
        covered: caption ? [caption] : [],
      });

      placeTooltip(tooltipRef.current, v.hits, l.hovered, v.size);

      if (onScreen && !reducedMotion.matches) request();
    }

    function request() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    v.request = request;

    // The Sun in the middle, with the view fitted to the space there is.
    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;

      v.size = { width, height };
      v.camera = fitRadius(v.size, width < 640 ? NARROW_RADIUS : RADIUS);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      render(performance.now());
    });

    resize.observe(wrap);

    // The pulse stops while the map is scrolled out of view.
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      request();
    });

    visibility.observe(wrap);

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

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      theme.disconnect();
      clearInterval(tick);
      v.request = () => {};
    };
  }, []);

  function position(event: React.PointerEvent | React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();

    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function hover(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType !== "mouse") return;

    const { x, y } = position(event);
    const hit = hitAt(view.current.hits, x, y);
    const current = latest.current.hovered;

    event.currentTarget.style.cursor = hit ? "pointer" : "default";

    if (hit?.kind !== current?.kind || hit?.slug !== current?.slug) {
      setHovered(hit ? ({ kind: hit.kind, slug: hit.slug } as Target) : null);
    }
  }

  // A click (or a tap, with room for a finger) opens the full map on what
  // was clicked.
  function open(event: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = position(event);
    const native = event.nativeEvent as PointerEvent;
    const touch = native.pointerType !== undefined && native.pointerType !== "mouse";
    const hit = hitAt(view.current.hits, x, y, touch ? 14 : 0);

    if (!hit) return;

    if (hit.kind === "body") {
      router.push(`/map?body=${hit.slug}`);
      return;
    }

    const mission = craft.find(({ slug }) => slug === hit.slug)?.mission.slug;

    if (mission) router.push(`/map?mission=${mission}`);
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Map of the inner solar system out to Jupiter, showing where each spacecraft is now."
        className="absolute inset-0 h-full w-full"
        onPointerMove={hover}
        onPointerLeave={() => setHovered(null)}
        onClick={open}
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

      {scene && (
        <p
          ref={captionRef}
          className="pointer-events-none absolute bottom-3 left-3 mr-3 rounded-md bg-background/85 px-2 py-1 text-xs text-muted backdrop-blur"
        >
          Positions for {timeFormat.format(dayToDate(scene.t))} UTC · JPL
          Horizons
        </p>
      )}
    </div>
  );
}
