"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  MOON_NAMES,
  buildScene,
  dayToDate,
  type MapCraft,
  type Scene,
} from "@/lib/map-scene";
import { daysSinceJ2000 } from "@/lib/orbits";
import { fitRadius, type Camera, type Size } from "./camera";
import { drawMap, type Box, type Hit, type Palette, type Target } from "./draw";
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
  // How far the page has moved from the hero (0) to the map section (1).
  progress: RefObject<number>;
  // Text and buttons laid over the map in each stage, which labels keep
  // clear of.
  heroOverlays: RefObject<HTMLElement | null>[];
  mapOverlays: RefObject<HTMLElement | null>[];
  // A click on the map while it is still in the hero.
  onExplore: () => void;
  captionClassName?: string;
};

// The hero shows a quarter of the map: the Sun in the bottom-left corner,
// this far in, with Jupiter's orbit sweeping across most of the height.
const CORNER_INSET = 28;
const JUPITER_AU = 5.2;
const JUPITER_SHARE = 0.85;

// The map section shows everything out past Jupiter's orbit around the Sun,
// or just the inner planets on a narrow screen.
const RADIUS = 5.6;
const NARROW_RADIUS = 1.8;

const INSETS = { top: 18, bottom: 18, left: 18, right: 18 };

// The part of the screen the map section centres the map in: all of it, or
// on a narrow screen the space between the text above and the button below,
// which would otherwise cover much of the map. Uses layout positions, which
// the overlays' slide in and out does not change.
function openArea(size: Size, overlays: (HTMLElement | null)[]) {
  const area = { top: 0, bottom: size.height };

  if (size.width >= 640) return area;

  for (const element of overlays) {
    if (!element) continue;

    const top = element.offsetTop;
    const bottom = top + element.offsetHeight;

    if (bottom < size.height / 2) area.top = Math.max(area.top, bottom);
    else if (top > size.height / 2) area.bottom = Math.min(area.bottom, top);
  }

  return area;
}

// The view at a point between the two stages. The Sun moves in a straight
// line from the corner to the middle of the open area, and the scale changes
// evenly.
function cameraAt(
  size: Size,
  p: number,
  area: { top: number; bottom: number },
): Camera {
  const { width, height } = size;
  const start = {
    x: CORNER_INSET,
    y: height - CORNER_INSET,
    scale: (height * JUPITER_SHARE) / JUPITER_AU,
  };
  const end = {
    x: width / 2,
    y: (area.top + area.bottom) / 2,
    scale: fitRadius(
      { width, height: area.bottom - area.top },
      width < 640 ? NARROW_RADIUS : RADIUS,
    ).scale,
  };
  const sunX = start.x + (end.x - start.x) * p;
  const sunY = start.y + (end.y - start.y) * p;
  const scale = start.scale * Math.pow(end.scale / start.scale, p);

  // The camera that puts the Sun at (sunX, sunY) on screen.
  return {
    x: (width / 2 - sunX) / scale,
    y: (sunY - height / 2) / scale,
    scale,
  };
}

// Where an element sits over the map, in the map's own coordinates.
function boxOf(element: Element | null | undefined, origin: DOMRect): Box | null {
  const box = element?.getBoundingClientRect();

  if (!box || box.width === 0 || box.bottom <= origin.top) return null;

  return {
    left: box.left - origin.left - 4,
    top: box.top - origin.top - 4,
    right: box.right - origin.left + 4,
    bottom: box.bottom - origin.top + 4,
  };
}

// The home page's map: where every craft is now, with tooltips and a faint
// route on hover, but no panning or zooming, so scrolling the page never gets
// caught by it. In the hero any click moves the page on to the map section;
// there, clicking a craft or a planet opens the full map with it selected.
export default function MapPreview({
  craft,
  names: placeNames,
  progress,
  heroOverlays,
  mapOverlays,
  onExplore,
  captionClassName = "bottom-3 left-3",
}: Props) {
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
    heroOverlays,
    mapOverlays,
    palette: null as Palette | null,
  });

  const view = useRef({
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
      heroOverlays,
      mapOverlays,
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
      const p = progress.current;

      if (!width || !height) return;

      const dpr = window.devicePixelRatio || 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!l.data || !l.palette) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      // The site's header sits over the top of the hero until it scrolls
      // away; the text and buttons of each stage cover the map while shown.
      const origin = wrap.getBoundingClientRect();
      const header = boxOf(document.querySelector("body > header"), origin);
      const overlays = (p < 0.5 ? l.heroOverlays : l.mapOverlays).map((ref) =>
        boxOf(ref.current, origin),
      );
      const caption = p < 0.5 ? null : boxOf(captionRef.current, origin);
      const covered = [header, caption, ...overlays].filter(
        (box) => box !== null,
      );

      v.hits = drawMap({
        ctx,
        size: v.size,
        camera: cameraAt(
          v.size,
          p,
          openArea(v.size, [
            ...l.mapOverlays.map((ref) => ref.current),
            captionRef.current,
          ]),
        ),
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
          top: header ? Math.max(INSETS.top, header.bottom + 6) : INSETS.top,
          bottom: caption
            ? Math.max(INSETS.bottom, height - caption.top + 6)
            : INSETS.bottom,
        },
        pulse: reducedMotion.matches ? null : (time % PULSE_MS) / PULSE_MS,
        covered,
        // Markers for things out of view only appear as the map arrives in
        // the middle; in the corner, most of the solar system is out of view.
        edges: Math.min(1, Math.max(0, (p - 0.7) / 0.3)),
      });

      placeTooltip(tooltipRef.current, v.hits, l.hovered, v.size);

      if (onScreen && !reducedMotion.matches) request();
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

    // Positions move on in real time, and the view with the page's scroll.
    const tick = setInterval(request, 1000);

    window.addEventListener("scroll", request, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      theme.disconnect();
      clearInterval(tick);
      window.removeEventListener("scroll", request);
      v.request = () => {};
    };
  }, [progress]);

  function position(event: React.PointerEvent | React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();

    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function hover(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType !== "mouse") return;

    const { x, y } = position(event);
    const hit = hitAt(view.current.hits, x, y);
    const current = latest.current.hovered;

    // In the hero the whole map is a way into the map section.
    event.currentTarget.style.cursor =
      hit || progress.current < 0.5 ? "pointer" : "default";

    if (hit?.kind !== current?.kind || hit?.slug !== current?.slug) {
      setHovered(hit ? ({ kind: hit.kind, slug: hit.slug } as Target) : null);
    }
  }

  // In the hero, any click moves on to the map section. There, a click (or a
  // tap, with room for a finger) opens the full map on what was clicked.
  function open(event: React.MouseEvent<HTMLCanvasElement>) {
    if (progress.current < 0.9) {
      onExplore();
      return;
    }

    const { x, y } = position(event);
    const native = event.nativeEvent as PointerEvent;
    const touch =
      native.pointerType !== undefined && native.pointerType !== "mouse";
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
        aria-label="Map of the solar system, showing where each spacecraft is now."
        className="absolute inset-0 h-full w-full"
        onPointerMove={hover}
        onPointerLeave={() => setHovered(null)}
        onClick={open}
      />

      {!data && failed && (
        <p className="absolute inset-0 grid place-items-center text-muted">
          The positions could not be loaded.
        </p>
      )}

      <div
        ref={tooltipRef}
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-0 z-10 w-60 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm shadow-lg"
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
        // Shown with the map section, not in the hero.
        <p
          ref={captionRef}
          style={{ opacity: "calc((var(--p, 1) - 0.6) * 2.5)" }}
          className={`pointer-events-none absolute z-10 mr-3 rounded-md bg-background/85 px-2 py-1 text-xs text-muted backdrop-blur ${captionClassName}`}
        >
          Positions for {timeFormat.format(dayToDate(scene.t))} UTC · JPL
          Horizons
        </p>
      )}
    </div>
  );
}
