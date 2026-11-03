import {
  PLANETS,
  formatDistance,
  fromSun,
  localTrail,
  routeSamples,
  type LocalTrail,
  type MapCraft,
  type Positions,
  type Scene,
} from "@/lib/map-scene";
import {
  MOONS,
  daysSinceJ2000,
  distance,
  orbitOutline,
  type BodySlug,
  type Days,
  type LocalIndex,
  type LocalPath,
  type MoonSlug,
  type PositionsSnapshot,
  type Vec3,
} from "@/lib/orbits";
import type { Size } from "./camera";
import type { Hit, Palette, Target, Trail } from "./draw";

// What the full map and the home page's map have in common: loading the
// positions, the theme's colours, finding what is under the pointer, and the
// tooltip.

export type MapData = {
  snapshot: PositionsSnapshot;
  orbits: { slug: BodySlug; points: Vec3[] }[];
  moonOrbits: { slug: MoonSlug; points: Vec3[] }[];
};

const ORBITS: BodySlug[] = [...PLANETS, "pluto"];

// How long one pulse around an active mission takes, in milliseconds.
export const PULSE_MS = 2400;

export const timeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

// Fetches public/positions.json and works out the orbit lines for today.
export async function loadPositions(): Promise<{
  data: MapData;
  today: Days;
}> {
  const response = await fetch("/positions.json");

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const snapshot = (await response.json()) as PositionsSnapshot;
  const today = daysSinceJ2000(new Date());

  return {
    data: {
      snapshot,
      // Fine enough that a planet sits on its orbit line even zoomed in
      // close enough to see its moons.
      orbits: ORBITS.map((slug) => ({
        slug,
        points: orbitOutline(snapshot.bodies[slug], today, 2048),
      })),
      moonOrbits: (Object.keys(MOONS) as MoonSlug[]).map((slug) => ({
        slug,
        points: orbitOutline(snapshot.moons[slug], today, 180),
      })),
    },
    today,
  };
}

// public/local/index.json: which craft have a path around the body they
// stayed at. Null if it cannot be loaded; the map then works without them.
export async function loadLocalIndex(): Promise<LocalIndex | null> {
  try {
    const response = await fetch("/local/index.json");

    return response.ok ? ((await response.json()) as LocalIndex) : null;
  } catch {
    return null;
  }
}

// One craft's path around its body, fetched once however often it is asked
// for.
const localPaths = new Map<string, Promise<LocalPath | null>>();

export function loadLocalPath(horizonsId: string) {
  let path = localPaths.get(horizonsId);

  if (!path) {
    path = fetch(`/local/${horizonsId}.json`)
      .then((response) =>
        response.ok ? (response.json() as Promise<LocalPath>) : null,
      )
      .catch(() => null);
    localPaths.set(horizonsId, path);
  }

  return path;
}

// The Horizons IDs of a mission's craft that have a path around a body.
export function missionLocalIds(
  craft: MapCraft[],
  index: LocalIndex | null,
  mission: string,
) {
  return [
    ...new Set(
      craft
        .filter(
          (one) =>
            one.mission.slug === mission &&
            one.horizonsId &&
            index?.craft[one.horizonsId],
        )
        .map((one) => one.horizonsId!),
    ),
  ];
}

// Theme colours, resolved to plain colours a canvas understands.
export function readPalette(): Palette {
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
export function missionTrails(
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

// A mission's paths around a body that have been loaded, ready to draw.
export function missionLocalTrails(
  craft: MapCraft[],
  positions: Positions,
  index: LocalIndex | null,
  mission: string,
): LocalTrail[] {
  return missionLocalIds(craft, index, mission)
    .map((id) => positions.local?.[id])
    .filter((local) => local !== undefined)
    .map((local) => localTrail(local, positions));
}

// The nearest target to (x, y), allowing `slack` extra pixels for a finger.
// A label counts when the point is inside its box.
export function hitAt(hits: Hit[], x: number, y: number, slack = 0) {
  let best: Hit | null = null;
  let bestMiss = Infinity;

  for (const hit of hits) {
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

// Keeps the tooltip beside whatever it describes: below and to the right,
// unless that would run off the map. Hidden when the target is not drawn.
export function placeTooltip(
  tip: HTMLElement | null,
  hits: Hit[],
  hovered: Target | null,
  size: Size,
) {
  if (!tip) return;

  const hit =
    hovered &&
    hits.find((one) => one.kind === hovered.kind && one.slug === hovered.slug);

  if (!hit) {
    tip.style.visibility = "hidden";
    return;
  }

  const left = hit.x + 260 > size.width ? hit.x - 254 : hit.x + 14;
  const top =
    hit.y + 14 + tip.offsetHeight > size.height
      ? hit.y - 14 - tip.offsetHeight
      : hit.y + 14;

  tip.style.transform = `translate(${left}px, ${top}px)`;
  tip.style.visibility = "visible";
}

export function TooltipContent({
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
  const local = scene.local.find(({ craft: c }) => c.slug === target.slug);

  if (!one || !(free || local)) return null;

  return (
    <>
      <p className="font-semibold">{one.name}</p>
      {one.mission.name !== one.name && (
        <p className="text-muted">{one.mission.name}</p>
      )}
      <p className="text-muted">
        {free
          ? `${formatDistance(fromSun(free.position))} from the Sun · ${formatDistance(distance(free.position, scene.earth))} from Earth`
          : local && aroundBody(local, scene, names)}
      </p>
    </>
  );
}

// How far a craft near a body is from it, and from Earth or, for a craft
// near Earth, from the Moon: "1.5 million km from Earth · 1.2 million km
// from the Moon".
export function aroundBody(
  local: Scene["local"][number],
  scene: Scene,
  names: Record<string, string>,
) {
  const fromBody = `${formatDistance(Math.hypot(...local.offset))} from ${names[local.body]}`;

  if (local.body !== "earth") {
    return `${fromBody} · ${formatDistance(distance(local.position, scene.earth))} from Earth`;
  }

  const moon = scene.moons.find(({ slug }) => slug === "moon")!;

  return `${fromBody} · ${formatDistance(distance(local.position, moon.position))} from the Moon`;
}
