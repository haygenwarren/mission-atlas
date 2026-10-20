// What part of space the map shows: the point at the centre of the screen,
// in AU, and how many CSS pixels one AU takes up. The map is drawn from above
// the plane of the planets, with x to the right and y up.
export type Camera = { x: number; y: number; scale: number };

export type Size = { width: number; height: number };

// From about 400 AU across the screen (past Voyager 1) down to 0.004 AU
// (one and a half times the distance to the Moon), close enough to see the
// Moon apart from Earth.
const WIDEST_AU = 400;
const NARROWEST_AU = 0.004;

function clampScale(scale: number, size: Size) {
  const span = Math.min(size.width, size.height);

  return Math.min(Math.max(scale, span / WIDEST_AU), span / NARROWEST_AU);
}

export function toScreen(camera: Camera, size: Size, x: number, y: number) {
  return [
    size.width / 2 + (x - camera.x) * camera.scale,
    size.height / 2 - (y - camera.y) * camera.scale,
  ] as const;
}

export function toWorld(camera: Camera, size: Size, sx: number, sy: number) {
  return [
    camera.x + (sx - size.width / 2) / camera.scale,
    camera.y - (sy - size.height / 2) / camera.scale,
  ] as const;
}

// Zooms by `factor`, keeping the point under (sx, sy) where it is, the way
// a map zooms towards the cursor.
export function zoomAround(
  camera: Camera,
  size: Size,
  factor: number,
  sx: number,
  sy: number,
): Camera {
  const [wx, wy] = toWorld(camera, size, sx, sy);
  const scale = clampScale(camera.scale * factor, size);

  return {
    x: wx - (sx - size.width / 2) / scale,
    y: wy + (sy - size.height / 2) / scale,
    scale,
  };
}

export function panBy(camera: Camera, dx: number, dy: number): Camera {
  return {
    ...camera,
    x: camera.x - dx / camera.scale,
    y: camera.y + dy / camera.scale,
  };
}

// A view with `radius` AU around (x, y) filling the shorter side of the
// screen, with a little room to spare.
export function fitRadius(size: Size, radius: number, x = 0, y = 0): Camera {
  const span = Math.min(size.width, size.height);

  return { x, y, scale: clampScale((span / 2 / radius) * 0.9, size) };
}

// Part way from one view to another. The scale changes geometrically, so a
// zoom from 200 AU to 2 AU feels even all the way through.
export function between(from: Camera, to: Camera, k: number): Camera {
  return {
    x: from.x + (to.x - from.x) * k,
    y: from.y + (to.y - from.y) * k,
    scale: from.scale * Math.pow(to.scale / from.scale, k),
  };
}

// A flight from one view to another that pulls back while it pans and closes
// in as it arrives, so a long move never smears across the screen. This is
// "smooth and efficient zooming and panning" (J. van Wijk and W. Nuij, 2003),
// the method behind d3's zoom transitions. `at(k)` gives the view part way,
// for k from 0 to 1; `duration` is a comfortable length for the trip, in
// milliseconds.
const RHO = Math.SQRT2;

export function flight(from: Camera, to: Camera, size: Size) {
  const span = Math.min(size.width, size.height);
  // How much of space (AU) the shorter side of the screen covers.
  const w0 = span / from.scale;
  const w1 = span / to.scale;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy);
  const view = (x: number, y: number, w: number): Camera => ({
    x,
    y,
    scale: span / w,
  });

  // Zooming on the spot.
  if (d < 1e-9) {
    const S = Math.log(w1 / w0) / RHO;

    return {
      duration: Math.abs(S) * 1000,
      at: (k: number) => view(from.x, from.y, w0 * Math.exp(RHO * k * S)),
    };
  }

  const b0 = (w1 * w1 - w0 * w0 + RHO ** 4 * d * d) / (2 * w0 * RHO ** 2 * d);
  const b1 = (w1 * w1 - w0 * w0 - RHO ** 4 * d * d) / (2 * w1 * RHO ** 2 * d);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
  const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (r1 - r0) / RHO;

  return {
    duration: S * 1000,
    at: (k: number) => {
      const s = k * S;
      const u =
        (w0 / (RHO ** 2 * d)) *
        (Math.cosh(r0) * Math.tanh(RHO * s + r0) - Math.sinh(r0));

      return view(
        from.x + u * dx,
        from.y + u * dy,
        (w0 * Math.cosh(r0)) / Math.cosh(RHO * s + r0),
      );
    },
  };
}

export function easeInOut(k: number) {
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}

export function easeOut(k: number) {
  return 1 - Math.pow(1 - k, 3);
}
