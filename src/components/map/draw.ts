import type { Status } from "@/generated/prisma/enums";
import {
  DWARF_PLANETS,
  PLANETS,
  formatDistance,
  fromSun,
  type MapCraft,
  type Scene,
} from "@/lib/map-scene";
import type { BodySlug, MoonSlug, PlaceSlug, Vec3 } from "@/lib/orbits";
import { toScreen, type Camera, type Size } from "./camera";

// Theme colours and fonts, read from the page's CSS so the map follows the
// light and dark themes.
export type Palette = {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  borderStrong: string;
  accent: string;
  active: string;
  completed: string;
  failed: string;
  sans: string;
  mono: string;
};

export type Target =
  | { kind: "craft"; slug: string }
  | { kind: "body"; slug: PlaceSlug };

export type Box = { left: number; top: number; right: number; bottom: number };

// Where a target was drawn, for finding what is under the pointer: a circle
// around a dot, or the box of its label. Markers at the edge of the screen
// also carry `reach`, how far out (AU) the view must go to show the thing.
export type Hit = Target & {
  x: number;
  y: number;
  radius: number;
  box?: Box;
  reach?: number;
};

// A route sampled finely enough to draw as a smooth curve: [t, x, y].
export type Trail = [t: number, x: number, y: number][];

export type Frame = {
  ctx: CanvasRenderingContext2D;
  size: Size;
  camera: Camera;
  scene: Scene;
  palette: Palette;
  names: Record<string, string>;
  orbits: { slug: BodySlug; points: Vec3[] }[];
  // Each moon's orbit, around its planet.
  moonOrbits: { slug: MoonSlug; points: Vec3[] }[];
  hovered: Target | null;
  // A mission hovered in the list, highlighted like a hovered craft.
  hoveredMission: string | null;
  selectedMission: string | null;
  selectedBody: PlaceSlug | null;
  // The selected mission's routes, drawn in full, and the hovered one's,
  // drawn faintly.
  trails: Trail[];
  hoverTrails: Trail[];
  // Room to leave at the edges, and areas covered by controls laid over the
  // map, which labels keep clear of.
  insets: { top: number; bottom: number; left: number; right: number };
  covered: Box[];
  // Where the pulse around active missions is in its cycle, from 0 to 1, or
  // null for no pulse (for visitors who ask for reduced motion).
  pulse: number | null;
  // How visible the markers at the edge for things out of view are, from 0
  // (not drawn) to 1. The home page fades them in as its map moves.
  edges?: number;
  // The asteroids and comets to show, whatever the zoom, in place of the
  // usual choice by zoom: a replay shows only the ones its mission went to.
  smallBodies?: BodySlug[];
};

// Small bodies are left out until the map is zoomed in this far (pixels per
// AU), unless craft are there or one is selected.
const SMALL_BODY_SCALE = 90;
// Craft near Earth's orbit whose missions have ended are only named from
// this zoom on, since several retired telescopes crowd around it.
const ENDED_LABEL_SCALE = 200;
const CROWDED_AU = 2;

// Sizes in CSS pixels. Nothing is to scale: at the scale of the map, even
// Jupiter would be far smaller than a pixel.
const SUN_RADIUS = 7;
const PLANET_RADIUS: Partial<Record<BodySlug, number>> = {
  mercury: 4.5,
  venus: 6,
  earth: 6,
  mars: 5,
  jupiter: 9,
  saturn: 8.5,
  uranus: 7,
  neptune: 7,
};
const DWARF_RADIUS = 4;
const MOON_RADIUS = 3.5;

// A moon is drawn apart from its planet once it would be this many pixels
// away; closer than that, its missions are counted in the planet's badge.
const SPLIT_PX = 36;
const SMALL_BODY_RADIUS = 3;
const CRAFT_RADIUS = 6;

// How each kind of label is set, as on a printed map: planets in wide
// capitals, asteroids and comets in italics, spacecraft plainly, and the
// markers at the edge in monospace.
type LabelStyle = "planet" | "moon" | "small-body" | "craft" | "edge";

function setLabelFont(
  ctx: CanvasRenderingContext2D,
  style: LabelStyle,
  palette: Palette,
) {
  const caps = style === "planet" || style === "moon";

  ctx.letterSpacing = style === "planet" ? "1.5px" : caps ? "1px" : "0px";
  ctx.fontStretch = caps ? "expanded" : "normal";
  ctx.font = {
    planet: `600 13px ${palette.sans}`,
    moon: `600 11px ${palette.sans}`,
    "small-body": `italic 12px ${palette.sans}`,
    craft: `12px ${palette.sans}`,
    edge: `11px ${palette.mono}`,
  }[style];
}

// A label beside something drawn at (x, y). It goes `right` pixels to the
// right of x if there is room, otherwise `left` pixels to the left; a label
// with only one of the two stays on that side. A label with a target can be
// clicked like the thing it names.
type Label = {
  text: string;
  x: number;
  y: number;
  right?: number;
  left?: number;
  style: LabelStyle;
  color: string;
  priority: number;
  target?: Target;
  reach?: number;
  alpha?: number;
};

function statusColour(palette: Palette, status: Status) {
  if (status === "ACTIVE") return palette.active;
  if (status === "FAILED") return palette.failed;
  return palette.completed;
}

function same(a: Target | null, kind: Target["kind"], slug: string) {
  return a !== null && a.kind === kind && a.slug === slug;
}

// Where the line from the centre of the screen towards (x, y) meets the
// edge of the area left clear of the controls.
function edgePoint(
  size: Size,
  insets: Frame["insets"],
  x: number,
  y: number,
) {
  const cx = (insets.left + size.width - insets.right) / 2;
  const cy = (insets.top + size.height - insets.bottom) / 2;
  const dx = x - cx;
  const dy = y - cy;
  const t = Math.min(
    dx < 0
      ? (cx - insets.left) / -dx
      : dx > 0
        ? (size.width - insets.right - cx) / dx
        : Infinity,
    dy < 0
      ? (cy - insets.top) / -dy
      : dy > 0
        ? (size.height - insets.bottom - cy) / dy
        : Infinity,
  );

  return { x: cx + dx * t, y: cy + dy * t, angle: Math.atan2(dy, dx) };
}

// A label for an edge marker sits on the side away from the edge.
function edgeLabel(edge: { x: number; y: number; angle: number }) {
  const x = edge.x - Math.cos(edge.angle) * 14;
  const y = edge.y - Math.sin(edge.angle) * 14;

  return Math.cos(edge.angle) > 0 ? { x, y, left: 0 } : { x, y, right: 0 };
}

function onScreen(size: Size, x: number, y: number, margin = 0) {
  return (
    x >= -margin &&
    y >= -margin &&
    x <= size.width + margin &&
    y <= size.height + margin
  );
}

function polyline(
  ctx: CanvasRenderingContext2D,
  points: readonly (readonly [number, number])[],
) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
}

function diamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.stroke();
}

// A route, solid where the craft has been and dashed where it is still to
// go, meeting at where it is now.
function drawTrail(
  ctx: CanvasRenderingContext2D,
  trail: Trail,
  t: number,
  screen: (x: number, y: number) => readonly [number, number],
) {
  const past = trail.filter(([time]) => time <= t);
  const ahead = trail.filter(([time]) => time > t);

  if (past.length > 0 && ahead.length > 0) {
    const [t1, x1, y1] = past[past.length - 1];
    const [t2, x2, y2] = ahead[0];
    const k = (t - t1) / (t2 - t1);
    const now: Trail[number] = [t, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k];

    past.push(now);
    ahead.unshift(now);
  }

  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  polyline(
    ctx,
    past.map(([, x, y]) => screen(x, y)),
  );
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  polyline(
    ctx,
    ahead.map(([, x, y]) => screen(x, y)),
  );
  ctx.setLineDash([]);
}

export function drawMap(frame: Frame): Hit[] {
  const { ctx, size, camera, scene, palette, names } = frame;
  const { hovered, hoveredMission, selectedMission, selectedBody, insets } =
    frame;
  const hits: Hit[] = [];
  const labels: Label[] = [];
  const edges = frame.edges ?? 1;
  // Dots, badges and controls, which labels must not cover.
  const taken: Box[] = [...frame.covered];
  const around = (x: number, y: number, r: number) =>
    taken.push({ left: x - r, top: y - r, right: x + r, bottom: y + r });
  const screen = (x: number, y: number) => toScreen(camera, size, x, y);

  // A count of the missions at a place, starting at `left`; it pulses if any
  // of them is active. Returns where the badge ends.
  const badge = (target: Target, left: number, y: number, here: MapCraft[]) => {
    const text = String(new Set(here.map(({ mission }) => mission.slug)).size);

    ctx.letterSpacing = "0px";
    ctx.fontStretch = "normal";
    ctx.font = `500 11px ${palette.mono}`;

    const width = ctx.measureText(text).width + 12;
    const anyActive = here.some(({ status }) => status === "ACTIVE");

    if (anyActive && frame.pulse !== null) {
      const grow = frame.pulse * 7;

      ctx.strokeStyle = palette.active;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.45 * (1 - frame.pulse);
      ctx.beginPath();
      ctx.roundRect(
        left - grow,
        y - 9 - grow,
        width + 2 * grow,
        18 + 2 * grow,
        9 + grow,
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = palette.surface;
    ctx.strokeStyle = anyActive ? palette.active : palette.borderStrong;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(left, y - 9, width, 18, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = palette.foreground;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, left + width / 2, y + 0.5);
    taken.push({ left, top: y - 9, right: left + width, bottom: y + 9 });
    hits.push({ ...target, x: left + width / 2, y, radius: 13 });

    return left + width;
  };

  // Moons far enough from their planet on screen are drawn on their own;
  // the craft at the rest are counted with their planet.
  const planetAt = new Map(scene.bodies.map((body) => [body.slug, body]));
  const apart = new Set<MoonSlug>();
  const merged = new Map<BodySlug, MapCraft[]>();

  for (const moon of scene.moons) {
    const parent = planetAt.get(moon.parent)!.position;
    const gap =
      Math.hypot(moon.position[0] - parent[0], moon.position[1] - parent[1]) *
      camera.scale;

    if (gap >= SPLIT_PX) {
      apart.add(moon.slug);
    } else {
      merged.set(moon.parent, [...(merged.get(moon.parent) ?? []), ...moon.craft]);
    }
  }

  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, size.width, size.height);

  // Orbits of the planets and Pluto, skipped when too small to see.
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = palette.borderStrong;
  ctx.globalAlpha = 0.85;
  for (const { slug, points } of frame.orbits) {
    const reach = Math.max(...points.map(([x, y]) => Math.hypot(x, y)));

    if (reach * camera.scale < 6) continue;

    ctx.setLineDash(slug === "pluto" ? [4, 5] : []);
    polyline(
      ctx,
      points.map(([x, y]) => screen(x, y)),
    );
  }
  ctx.setLineDash([]);

  // Orbits of the moons drawn apart, around their planets.
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  for (const { slug, points } of frame.moonOrbits) {
    if (!apart.has(slug)) continue;

    const [px, py] = planetAt.get(scene.moons.find((m) => m.slug === slug)!.parent)!
      .position;

    polyline(
      ctx,
      points.map(([x, y]) => screen(px + x, py + y)),
    );
  }
  ctx.globalAlpha = 1;

  // The Sun.
  const [sunX, sunY] = screen(0, 0);
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 30);

  glow.addColorStop(0, palette.foreground);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.4;
  ctx.fillRect(sunX - 30, sunY - 30, 60, 60);
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.foreground;
  ctx.beginPath();
  ctx.arc(sunX, sunY, SUN_RADIUS, 0, 2 * Math.PI);
  ctx.fill();
  around(sunX, sunY, SUN_RADIUS + 2);

  // Routes: the hovered mission's faintly, the selected mission's in full.
  ctx.strokeStyle = palette.accent;
  ctx.globalAlpha = 0.4;
  for (const trail of frame.hoverTrails) drawTrail(ctx, trail, scene.t, screen);
  ctx.globalAlpha = 1;
  for (const trail of frame.trails) drawTrail(ctx, trail, scene.t, screen);

  // A soft ring that grows and fades around each active craft in flight.
  if (frame.pulse !== null) {
    ctx.strokeStyle = palette.active;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5 * (1 - frame.pulse);

    for (const { craft, position } of scene.free) {
      if (craft.status !== "ACTIVE") continue;

      const [x, y] = screen(position[0], position[1]);

      if (onScreen(size, x, y, 30)) {
        ring(ctx, x, y, CRAFT_RADIUS + 2 + frame.pulse * 14);
      }
    }
    ctx.globalAlpha = 1;
  }

  // Planets, dwarf planets, asteroids and comets, with a count of the
  // missions at each.
  for (const body of scene.bodies) {
    const planet = PLANETS.includes(body.slug);
    const dwarf = DWARF_PLANETS.includes(body.slug);
    const here = [...body.craft, ...(merged.get(body.slug) ?? [])];
    const holds = (mission: string | null) =>
      mission !== null && here.some((craft) => craft.mission.slug === mission);
    const highlighted =
      same(hovered, "body", body.slug) ||
      selectedBody === body.slug ||
      holds(selectedMission) ||
      holds(hoveredMission);
    const target: Target = { kind: "body", slug: body.slug };
    const [x, y] = screen(body.position[0], body.position[1]);

    if (!onScreen(size, x, y, 40)) {
      if ((planet || body.slug === "pluto") && edges > 0) {
        const edge = edgePoint(size, insets, x, y);
        const reach = Math.hypot(body.position[0], body.position[1]);

        ctx.globalAlpha = edges;
        drawEdgeArrow(ctx, edge, highlighted ? palette.accent : palette.muted);
        ctx.globalAlpha = 1;
        hits.push({ ...target, x: edge.x, y: edge.y, radius: 14, reach });
        labels.push({
          text: `${names[body.slug]} · ${formatDistance(fromSun(body.position))}`,
          ...edgeLabel(edge),
          style: "edge",
          color: highlighted ? palette.foreground : palette.muted,
          priority: highlighted ? 90 : 20,
          target,
          reach,
          alpha: edges,
        });
      }
      continue;
    }

    const small = !planet && !dwarf;
    const hidden = frame.smallBodies
      ? !frame.smallBodies.includes(body.slug)
      : !highlighted && camera.scale < SMALL_BODY_SCALE;

    if (small && here.length === 0 && hidden) continue;

    const radius =
      PLANET_RADIUS[body.slug] ?? (dwarf ? DWARF_RADIUS : SMALL_BODY_RADIUS);

    ctx.fillStyle = planet || dwarf ? palette.foreground : palette.muted;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    around(x, y, radius + 1);

    if (highlighted) {
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2;
      ring(ctx, x, y, radius + 5);
    }

    let right = radius + 6;

    if (here.length > 0) {
      right = badge(target, x + radius + 6, y, here) + 6 - x;
    }

    hits.push({ ...target, x, y, radius: radius + 10 });
    labels.push({
      text: planet || dwarf ? names[body.slug].toUpperCase() : names[body.slug],
      x,
      y,
      right,
      left: radius + 6,
      style: planet || dwarf ? "planet" : "small-body",
      color: planet || dwarf ? palette.foreground : palette.muted,
      priority: highlighted
        ? 95
        : planet
          ? 80
          : here.length > 0
            ? 70
            : dwarf
              ? 50
              : 30,
      target,
    });
  }

  // Moons with room to be drawn apart from their planet, each with a count of
  // the missions at it.
  for (const moon of scene.moons) {
    if (!apart.has(moon.slug)) continue;

    const [x, y] = screen(moon.position[0], moon.position[1]);

    if (!onScreen(size, x, y, 40)) continue;

    const holds = (mission: string | null) =>
      mission !== null &&
      moon.craft.some((craft) => craft.mission.slug === mission);
    const highlighted =
      same(hovered, "body", moon.slug) ||
      selectedBody === moon.slug ||
      holds(selectedMission) ||
      holds(hoveredMission);
    const target: Target = { kind: "body", slug: moon.slug };

    ctx.fillStyle = palette.foreground;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(x, y, MOON_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
    around(x, y, MOON_RADIUS + 1);

    if (highlighted) {
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2;
      ring(ctx, x, y, MOON_RADIUS + 5);
    }

    let right = MOON_RADIUS + 6;

    if (moon.craft.length > 0) {
      right = badge(target, x + MOON_RADIUS + 6, y, moon.craft) + 6 - x;
    }

    hits.push({ ...target, x, y, radius: MOON_RADIUS + 10 });
    labels.push({
      text: names[moon.slug].toUpperCase(),
      x,
      y,
      right,
      left: MOON_RADIUS + 6,
      style: "moon",
      color: palette.foreground,
      priority: highlighted ? 95 : moon.craft.length > 0 ? 72 : 45,
      target,
    });
  }

  // Craft flying free, drawn from their routes.
  for (const { craft, position } of scene.free) {
    const [x, y] = screen(position[0], position[1]);
    const highlighted =
      craft.mission.slug === selectedMission ||
      craft.mission.slug === hoveredMission ||
      same(hovered, "craft", craft.slug);
    const ended = craft.status !== "ACTIVE";
    const colour = statusColour(palette, craft.status);
    const target: Target = { kind: "craft", slug: craft.slug };

    if (!onScreen(size, x, y, 8)) {
      if (edges === 0) continue;

      const edge = edgePoint(size, insets, x, y);
      const reach = Math.hypot(position[0], position[1]);

      ctx.globalAlpha = (ended && !highlighted ? 0.55 : 1) * edges;
      drawEdgeArrow(ctx, edge, colour);
      ctx.globalAlpha = 1;
      hits.push({ ...target, x: edge.x, y: edge.y, radius: 14, reach });
      labels.push({
        text: `${craft.name} · ${formatDistance(fromSun(position))}`,
        ...edgeLabel(edge),
        style: "edge",
        color: highlighted ? palette.foreground : palette.muted,
        priority: highlighted ? 90 : ended ? 15 : 25,
        target,
        reach,
        alpha: edges,
      });
      continue;
    }

    ctx.globalAlpha = ended && !highlighted ? 0.55 : 1;
    ctx.fillStyle = colour;
    diamond(ctx, x, y, highlighted ? CRAFT_RADIUS + 1.5 : CRAFT_RADIUS);
    ctx.fill();
    ctx.globalAlpha = 1;
    around(x, y, CRAFT_RADIUS + 1);

    if (highlighted) {
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2;
      ring(ctx, x, y, CRAFT_RADIUS + 6);
    }

    hits.push({ ...target, x, y, radius: CRAFT_RADIUS + 8 });

    if (
      ended &&
      !highlighted &&
      fromSun(position) < CROWDED_AU &&
      camera.scale < ENDED_LABEL_SCALE
    ) {
      continue;
    }

    labels.push({
      text: craft.name,
      x,
      y,
      right: CRAFT_RADIUS + 6,
      left: CRAFT_RADIUS + 6,
      style: "craft",
      color: ended && !highlighted ? palette.muted : palette.foreground,
      priority: highlighted ? 100 : ended ? 40 : 60,
      target,
    });
  }

  hits.push(...drawLabels(ctx, size, palette, labels, taken));
  ctx.letterSpacing = "0px";
  ctx.fontStretch = "normal";

  return hits;
}

// A triangle at the edge of the screen pointing towards something out of
// view.
function drawEdgeArrow(
  ctx: CanvasRenderingContext2D,
  edge: { x: number; y: number; angle: number },
  colour: string,
) {
  ctx.save();
  ctx.translate(edge.x, edge.y);
  ctx.rotate(edge.angle);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-5, -6);
  ctx.lineTo(-5, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Draws labels from most to least important. Each goes on its preferred
// side if that is on screen and clear of dots, badges, controls and earlier
// labels, else on the other side, else not at all. Returns the drawn labels
// that can be clicked.
function drawLabels(
  ctx: CanvasRenderingContext2D,
  size: Size,
  palette: Palette,
  labels: Label[],
  taken: Box[],
) {
  const placed = [...taken];
  const hits: Hit[] = [];
  const clear = (box: Box) =>
    box.left >= 0 &&
    box.right <= size.width &&
    box.top >= 0 &&
    box.bottom <= size.height &&
    !placed.some(
      (other) =>
        box.left < other.right &&
        box.right > other.left &&
        box.top < other.bottom &&
        box.bottom > other.top,
    );

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  for (const label of [...labels].sort((a, b) => b.priority - a.priority)) {
    setLabelFont(ctx, label.style, palette);

    const width = ctx.measureText(label.text).width;
    const options = [
      label.right === undefined ? null : label.x + label.right,
      label.left === undefined ? null : label.x - label.left - width,
    ].filter((start) => start !== null);

    for (const start of options) {
      const box = {
        left: start - 2,
        top: label.y - 8,
        right: start + width + 2,
        bottom: label.y + 8,
      };

      if (!clear(box)) continue;

      placed.push(box);
      ctx.fillStyle = label.color;
      ctx.globalAlpha = label.alpha ?? 1;
      ctx.fillText(label.text, start, label.y);
      ctx.globalAlpha = 1;

      if (label.target) {
        hits.push({
          ...label.target,
          x: (box.left + box.right) / 2,
          y: label.y,
          radius: 0,
          box,
          reach: label.reach,
        });
      }
      break;
    }
  }

  return hits;
}
