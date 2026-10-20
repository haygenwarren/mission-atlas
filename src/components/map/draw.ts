import type { Status } from "@/generated/prisma/enums";
import {
  DWARF_PLANETS,
  PLANETS,
  formatDistance,
  fromSun,
  type Scene,
} from "@/lib/map-scene";
import type { BodySlug, Vec3 } from "@/lib/orbits";
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
  | { kind: "body"; slug: BodySlug };

// Where a target was drawn, for finding what is under the pointer.
export type Hit = Target & { x: number; y: number; radius: number };

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
  hovered: Target | null;
  selectedMission: string | null;
  selectedBody: BodySlug | null;
  trails: Trail[];
  // Room to leave at the edges for the controls laid over the map.
  insets: { top: number; bottom: number; side: number };
};

// Small bodies are left out until the map is zoomed in this far (pixels per
// AU), unless craft are there or one is selected.
const SMALL_BODY_SCALE = 90;
// Craft whose missions have ended are only named from this zoom on, since
// several retired telescopes crowd around Earth's orbit.
const ENDED_LABEL_SCALE = 200;

type Box = { left: number; top: number; right: number; bottom: number };

// A label beside something drawn at (x, y). It goes `right` pixels to the
// right of x if there is room, otherwise `left` pixels to the left; a label
// with only one of the two stays on that side.
type Label = {
  text: string;
  x: number;
  y: number;
  right?: number;
  left?: number;
  font: string;
  color: string;
  priority: number;
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
  const cx = size.width / 2;
  const cy = (insets.top + size.height - insets.bottom) / 2;
  const dx = x - cx;
  const dy = y - cy;
  const t = Math.min(
    dx === 0 ? Infinity : (cx - insets.side) / Math.abs(dx),
    dy < 0 ? (cy - insets.top) / -dy : dy > 0 ? (size.height - insets.bottom - cy) / dy : Infinity,
  );

  return { x: cx + dx * t, y: cy + dy * t, angle: Math.atan2(dy, dx) };
}

// A label for an edge marker sits on the side away from the edge.
function edgeLabel(edge: { x: number; angle: number }, size: Size) {
  const x = edge.x - Math.cos(edge.angle) * 12;

  return edge.x > size.width / 2 ? { x, left: 0 } : { x, right: 0 };
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

export function drawMap(frame: Frame): Hit[] {
  const { ctx, size, camera, scene, palette, names } = frame;
  const { hovered, selectedMission, selectedBody, insets } = frame;
  const hits: Hit[] = [];
  const labels: Label[] = [];
  // Dots and badges, which labels must not cover.
  const taken: Box[] = [];
  const around = (x: number, y: number, r: number) =>
    taken.push({ left: x - r, top: y - r, right: x + r, bottom: y + r });
  const screen = (x: number, y: number) => toScreen(camera, size, x, y);

  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, size.width, size.height);

  // Orbits of the planets and Pluto, skipped when too small to see.
  ctx.lineWidth = 1;
  for (const { slug, points } of frame.orbits) {
    const reach = Math.max(...points.map(([x, y]) => Math.hypot(x, y)));

    if (reach * camera.scale < 4) continue;

    ctx.strokeStyle = palette.border;
    ctx.setLineDash(slug === "pluto" ? [3, 4] : []);
    polyline(
      ctx,
      points.map(([x, y]) => screen(x, y)),
    );
  }
  ctx.setLineDash([]);

  // The Sun.
  const [sunX, sunY] = screen(0, 0);
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 16);

  glow.addColorStop(0, palette.foreground);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(sunX - 16, sunY - 16, 32, 32);
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.foreground;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 4, 0, 2 * Math.PI);
  ctx.fill();

  // The selected mission's routes: solid where the craft has been, dashed
  // where it is still to go.
  ctx.strokeStyle = palette.accent;
  for (const trail of frame.trails) {
    const past = trail.filter(([t]) => t <= scene.t);
    const ahead = trail.filter(([t]) => t > scene.t);

    // Both halves meet at the craft's position now.
    if (past.length > 0 && ahead.length > 0) {
      const [t1, x1, y1] = past[past.length - 1];
      const [t2, x2, y2] = ahead[0];
      const k = (scene.t - t1) / (t2 - t1);
      const now: Trail[number] = [scene.t, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k];

      past.push(now);
      ahead.unshift(now);
    }

    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    polyline(
      ctx,
      past.map(([, x, y]) => screen(x, y)),
    );
    ctx.lineWidth = 1.25;
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.7;
    polyline(
      ctx,
      ahead.map(([, x, y]) => screen(x, y)),
    );
    ctx.globalAlpha = 1;
  }
  ctx.setLineDash([]);

  // Planets, dwarf planets, asteroids and comets, with a count of the craft
  // at each.
  for (const body of scene.bodies) {
    const planet = PLANETS.includes(body.slug);
    const dwarf = DWARF_PLANETS.includes(body.slug);
    const highlighted =
      same(hovered, "body", body.slug) || selectedBody === body.slug;
    const [x, y] = screen(body.position[0], body.position[1]);

    if (!onScreen(size, x, y, 40)) {
      if (planet || body.slug === "pluto") {
        const edge = edgePoint(size, insets, x, y);

        labels.push({
          text: `${names[body.slug]} · ${formatDistance(fromSun(body.position))}`,
          ...edgeLabel(edge, size),
          y: edge.y - Math.sin(edge.angle) * 12,
          font: `10px ${palette.mono}`,
          color: palette.muted,
          priority: 20,
        });
        drawEdgeArrow(ctx, edge, palette.muted);
      }
      continue;
    }

    if (
      !planet &&
      !dwarf &&
      body.craft.length === 0 &&
      !highlighted &&
      camera.scale < SMALL_BODY_SCALE
    ) {
      continue;
    }

    const radius = planet ? (["jupiter", "saturn"].includes(body.slug) ? 6 : 4.5) : dwarf ? 3 : 2;

    ctx.fillStyle = planet || dwarf ? palette.foreground : palette.muted;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    around(x, y, radius + 1);

    if (highlighted) {
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1.5;
      ring(ctx, x, y, radius + 4);
    }

    let right = radius + 5;

    if (body.craft.length > 0) {
      const text = String(body.craft.length);

      ctx.font = `500 10px ${palette.mono}`;

      const width = ctx.measureText(text).width + 10;
      const left = x + radius + 5;
      const anyActive = body.craft.some(({ status }) => status === "ACTIVE");

      ctx.fillStyle = palette.surface;
      ctx.strokeStyle = anyActive ? palette.active : palette.borderStrong;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(left, y - 8, width, 16, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = palette.foreground;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, left + width / 2, y + 0.5);
      taken.push({ left, top: y - 8, right: left + width, bottom: y + 8 });
      hits.push({
        kind: "body",
        slug: body.slug,
        x: left + width / 2,
        y,
        radius: 12,
      });
      right = left + width + 5 - x;
    }

    hits.push({ kind: "body", slug: body.slug, x, y, radius: radius + 9 });
    labels.push({
      text: names[body.slug],
      x,
      y,
      right,
      left: radius + 5,
      font: `${planet ? 12 : 11}px ${palette.sans}`,
      color: planet || dwarf ? palette.foreground : palette.muted,
      priority: highlighted ? 95 : planet ? 80 : body.craft.length > 0 ? 70 : dwarf ? 50 : 30,
    });
  }

  // Craft flying free, drawn from their routes.
  for (const { craft, position } of scene.free) {
    const [x, y] = screen(position[0], position[1]);
    const selected = craft.mission.slug === selectedMission;
    const highlighted = selected || same(hovered, "craft", craft.slug);
    const ended = craft.status !== "ACTIVE";
    const colour = statusColour(palette, craft.status);

    if (!onScreen(size, x, y, 6)) {
      const edge = edgePoint(size, insets, x, y);

      ctx.globalAlpha = ended && !highlighted ? 0.55 : 1;
      drawEdgeArrow(ctx, edge, colour);
      ctx.globalAlpha = 1;
      hits.push({
        kind: "craft",
        slug: craft.slug,
        x: edge.x,
        y: edge.y,
        radius: 12,
      });
      labels.push({
        text: `${craft.name} · ${formatDistance(fromSun(position))}`,
        ...edgeLabel(edge, size),
        y: edge.y - Math.sin(edge.angle) * 12,
        font: `10px ${palette.mono}`,
        color: highlighted ? palette.foreground : palette.muted,
        priority: highlighted ? 90 : ended ? 15 : 25,
      });
      continue;
    }

    ctx.globalAlpha = ended && !highlighted ? 0.55 : 1;
    ctx.fillStyle = colour;
    diamond(ctx, x, y, highlighted ? 5.5 : 4.5);
    ctx.fill();
    ctx.globalAlpha = 1;
    around(x, y, 5);

    if (highlighted) {
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1.5;
      ring(ctx, x, y, 9);
    }

    hits.push({ kind: "craft", slug: craft.slug, x, y, radius: 11 });

    if (ended && !highlighted && camera.scale < ENDED_LABEL_SCALE) continue;

    labels.push({
      text: craft.name,
      x,
      y,
      right: 9,
      left: 9,
      font: `11px ${palette.sans}`,
      color: ended && !highlighted ? palette.muted : palette.foreground,
      priority: highlighted ? 100 : ended ? 40 : 60,
    });
  }

  drawLabels(ctx, labels, taken);

  return hits;
}

// A small triangle at the edge of the screen pointing towards something out
// of view.
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
  ctx.moveTo(6, 0);
  ctx.lineTo(-4, -4.5);
  ctx.lineTo(-4, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Draws labels from most to least important. Each goes on its preferred
// side if that is clear of dots, badges and earlier labels, else on the other
// side, else not at all.
function drawLabels(
  ctx: CanvasRenderingContext2D,
  labels: Label[],
  taken: Box[],
) {
  const placed = [...taken];
  const clear = (box: Box) =>
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
    ctx.font = label.font;

    const width = ctx.measureText(label.text).width;
    const options = [
      label.right === undefined ? null : label.x + label.right,
      label.left === undefined ? null : label.x - label.left - width,
    ].filter((start) => start !== null);

    for (const start of options) {
      const box = {
        left: start - 2,
        top: label.y - 7,
        right: start + width + 2,
        bottom: label.y + 7,
      };

      if (!clear(box)) continue;

      placed.push(box);
      ctx.fillStyle = label.color;
      ctx.fillText(label.text, start, label.y);
      break;
    }
  }
}
