"use client";

import { useEffect, useRef, useState } from "react";
import type { DatePrecision, Status } from "@/generated/prisma/enums";

export type TimelineEvent = {
  key: string;
  title: string;
  // What happened; the launch has none when a mission doesn't list it.
  description: string | null;
  // ISO date strings, so the server can hand them over as they are.
  date: string;
  precision: DatePrecision;
  planned: boolean;
  end: boolean;
  // The craft it concerns, when it is not the whole mission.
  craft: string | null;
};

type Props = {
  status: Status;
  // When the page was built, so the server and browser agree on "today".
  now: string;
  events: TimelineEvent[];
};

type Side = "above" | "below";

type Placed = { side: Side; row: number; left: number; width: number };

type Geometry = {
  width: number;
  labels: Placed[];
  // Height of the label area above and below the bar.
  above: number;
  below: number;
};

// The band holding the line and the year marks, and the line within it.
const BAND = 36;
const LINE_Y = 14;
// Gap between the band and the nearest row of labels, and between rows.
const STEM = 16;
const ROW = 44;
const LABEL_H = 36;
// Space kept clear between labels in the same row.
const GAP = 12;
// Room at each end, so the first and last dots aren't cut off.
const PAD = 8;
// Narrower screens scroll the timeline sideways rather than squeeze it,
// giving each event at least this much room.
const MIN_WIDTH = 640;
const MIN_PER_EVENT = 100;
const PANEL_W = 400;
const PANEL_GAP = 20;

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

function formatEventDate(event: TimelineEvent) {
  const date = new Date(event.date);

  return event.precision === "MONTH"
    ? monthFormat.format(date)
    : dayFormat.format(date);
}

// Where each moment falls along the bar, from 0 to 1. Mostly to scale, but
// events that bunch together are spread out to a minimum spacing, and the
// long quiet stretches shrink to make room, so every event can be labelled.
// Between events the scale runs evenly, so year marks still fall in order.
function makeScale(times: number[], end: number) {
  const start = times[0];
  const span = Math.max(end - start, 1);
  const raw = times.map((t) => (t - start) / span);
  const minGap = Math.min(0.1, 0.7 / Math.max(times.length - 1, 1));
  const gaps = raw.slice(1).map((r, i) => Math.max(r - raw[i], minGap));
  const tail = 1 - raw[raw.length - 1];
  const tailMin = Math.min(tail, minGap / 2);
  // Take the extra room from whatever exceeds the minimum, evenly.
  const excess = gaps.reduce((sum, g) => sum + g, 0) + tail - 1;
  const spare =
    gaps.reduce((sum, g) => sum + (g - minGap), 0) + (tail - tailMin);
  const keep = excess > 0 && spare > 0 ? Math.max(0, 1 - excess / spare) : 1;
  const fitted = gaps.map((g) => minGap + (g - minGap) * keep);
  const fittedTail = tailMin + (tail - tailMin) * keep;
  const xs = [0];

  fitted.forEach((g) => xs.push(xs[xs.length - 1] + g));

  const total = xs[xs.length - 1] + fittedTail;
  const knots = [...times, end];
  const positions = [...xs, total].map((x) => x / total);

  return (time: number) => {
    if (time <= start) return 0;
    if (time >= end) return 1;

    const i = knots.findIndex((t, k) => time <= knots[k + 1] && time >= t);
    const [t0, t1] = [knots[i], knots[i + 1]];
    const [x0, x1] = [positions[i], positions[i + 1]];

    return t1 > t0 ? x0 + ((time - t0) / (t1 - t0)) * (x1 - x0) : x0;
  };
}

// Years marked along the bar: every year, or every 2, 5, 10 or 20, whichever
// gives no more than eight marks.
function yearTicks(start: number, end: number) {
  const first = new Date(start).getUTCFullYear() + 1;
  const last = new Date(end).getUTCFullYear();
  const step = [1, 2, 5, 10, 20].find((s) => (last - first) / s < 8) ?? 50;
  const ticks = [];

  for (let year = Math.ceil(first / step) * step; year <= last; year += step) {
    ticks.push(year);
  }

  return ticks;
}

// Labels go above and below the bar, alternating, each as close to the bar
// as it can be without overlapping another label or crossing another
// label's stem. A label sits centred over its dot if it can, or hangs to one
// side of it. When an event sits right under labels on both sides, no row
// can avoid every stem, so it takes the nearest row that is merely free (the
// stem then runs behind the label in the way).
const MAX_ROWS = 6;

function placeLabels(xs: number[], widths: number[], width: number) {
  const placed: Placed[] = [];
  let previous: Side = "below";

  xs.forEach((x, i) => {
    const w = widths[i];
    const clamp = (left: number) => Math.min(Math.max(left, 0), width - w);
    const lefts = [x - w / 2, x - 10, x - w + 10].map(clamp);
    const sides: Side[] =
      previous === "above" ? ["below", "above"] : ["above", "below"];
    const fits = (side: Side, row: number, left: number, strict: boolean) =>
      !placed.some((p, j) => {
        if (p.side !== side) return false;
        if (p.row === row) {
          return left < p.left + p.width + GAP && left + w + GAP > p.left;
        }
        if (!strict) return false;

        // This label's stem would run through a nearer label, or this label
        // would sit across a farther label's stem.
        return p.row < row
          ? x > p.left - 4 && x < p.left + p.width + 4
          : xs[j] > left - 4 && xs[j] < left + w + 4;
      });

    for (const strict of [true, false]) {
      for (let row = 0; row < (strict ? MAX_ROWS : Infinity); row++) {
        for (const side of sides) {
          const left = lefts.find((l) => fits(side, row, l, strict));

          if (left !== undefined) {
            placed.push({ side, row, left, width: w });
            previous = side;
            return;
          }
        }
      }
    }
  });

  return placed;
}

// The description, written out a letter at a time. Visitors who ask their
// system for less motion see it whole straight away, and screen readers get
// the whole text at once.
function WrittenText({ text }: { text: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Longer descriptions write faster, so none takes much over 2 seconds.
    const duration = Math.min(2200, Math.max(700, text.length * 16));
    let start = 0;
    let frame = requestAnimationFrame(function step(time) {
      if (reduced) {
        setShown(text.length);
        return;
      }

      start ||= time;

      const k = Math.min(1, (time - start) / duration);

      setShown(Math.round(text.length * k));
      if (k < 1) frame = requestAnimationFrame(step);
    });

    return () => cancelAnimationFrame(frame);
  }, [text]);

  return (
    <div className="relative mt-2 leading-relaxed text-foreground/90">
      {/* An invisible copy holds the space, so nothing moves as it writes. */}
      <p aria-hidden className="invisible">
        {text}
      </p>
      <p aria-hidden className="absolute inset-0">
        {text.slice(0, shown)}
        {shown < text.length && (
          <span className="ml-px inline-block h-[1.1em] w-0.5 translate-y-[0.15em] bg-accent" />
        )}
      </p>
      <p className="sr-only">{text}</p>
    </div>
  );
}

// A mission's key events on a bar drawn to scale from launch to the end (or
// on through today to the last planned event). Each event is labelled above
// or below the bar. Opening one fades the other labels, slides the bar out
// of the way, and writes out what happened.
export default function MissionTimeline({ status, now, events }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<(HTMLElement | null)[]>([]);
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastOpened = useRef<number | null>(null);

  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  const times = events.map(({ date }) => new Date(date).getTime());
  const nowTime = new Date(now).getTime();
  const start = times[0];
  const last = Math.max(...times);
  // An active mission runs on to today, or to its last planned event.
  const end = status === "ACTIVE" ? Math.max(last, nowTime) : last;
  const today = status === "ACTIVE" && nowTime < end ? nowTime : null;
  const fraction = makeScale(times, end);
  // Where a moment falls on the bar, as CSS and in pixels.
  const cssAt = (time: number) =>
    `calc(${PAD}px + ${fraction(time)} * (100% - ${2 * PAD}px))`;
  const pxAt = (time: number, width: number) =>
    PAD + fraction(time) * (width - 2 * PAD);

  // Measure the labels and lay them out, again whenever the width changes
  // or the fonts finish loading.
  useEffect(() => {
    const stage = stageRef.current!;
    const eventTimes = events.map(({ date }) => new Date(date).getTime());
    const scale = makeScale(eventTimes, end);

    function measure() {
      const width = stage.clientWidth;
      const widths = events.map(
        (_, i) => measureRefs.current[i]?.offsetWidth ?? 120,
      );
      const xs = eventTimes.map(
        (time) => PAD + scale(time) * (width - 2 * PAD),
      );
      const labels = placeLabels(xs, widths, width);
      const rows = (side: Side) =>
        Math.max(
          1,
          ...labels.filter((l) => l.side === side).map((l) => l.row + 1),
        );

      setGeometry({
        width,
        labels,
        above: STEM + rows("above") * ROW,
        below: STEM + rows("below") * ROW,
      });
    }

    const resize = new ResizeObserver(measure);

    resize.observe(stage);
    document.fonts?.ready.then(measure);

    return () => resize.disconnect();
  }, [events, end]);

  // The open panel's height decides how far the bar slides.
  useEffect(() => {
    const panel = panelRef.current;

    if (selected === null || !panel) return;

    const resize = new ResizeObserver(([entry]) =>
      setPanelHeight(entry.borderBoxSize[0].blockSize),
    );

    resize.observe(panel);
    // On a phone, scroll the timeline so the panel is in view.
    panel.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
    panel.focus({ preventScroll: true });

    return () => resize.disconnect();
  }, [selected]);

  function open(i: number) {
    lastOpened.current = i;
    setSelected(i);
  }

  function close() {
    const i = lastOpened.current;

    setSelected(null);
    // Return focus to the label that was opened, once it shows again.
    if (i !== null) {
      requestAnimationFrame(() => labelRefs.current[i]?.focus());
    }
  }

  function step(by: number) {
    if (selected === null) return;

    const next = selected + by;

    if (next >= 0 && next < events.length) open(next);
  }

  // Escape closes the open event; the arrow keys step through events.
  useEffect(() => {
    if (selected === null) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "ArrowRight") step(1);
    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  });

  const above = geometry?.above ?? STEM + ROW;
  const below = geometry?.below ?? STEM + ROW;
  const width = geometry?.width ?? 0;
  const openIndex = selected !== null && geometry ? selected : null;
  const openSide = openIndex !== null ? geometry!.labels[openIndex].side : null;

  // With an event open, the bar slides away from its label: down to the
  // bottom when the label was above it, up to the top when it was below.
  const normalHeight = above + BAND + below;
  let barTop = above;
  let height = normalHeight;
  let panelTop = 0;

  if (openSide === "above") {
    barTop = Math.max(panelHeight + PANEL_GAP, above + below);
    height = barTop + BAND;
  } else if (openSide === "below") {
    barTop = 0;
    panelTop = BAND + PANEL_GAP;
    height = Math.max(normalHeight, panelTop + panelHeight);
  }

  const panelWidth = Math.min(PANEL_W, width);
  const openX = openIndex !== null ? pxAt(times[openIndex], width) : 0;
  const panelLeft = Math.min(
    Math.max(openX - panelWidth / 2, 0),
    width - panelWidth,
  );
  const opened = openIndex !== null ? events[openIndex] : null;

  const dotClasses = (e: TimelineEvent) =>
    e.planned
      ? "border-accent bg-background"
      : e.end
        ? status === "FAILED"
          ? "border-status-failed bg-status-failed"
          : "border-status-completed bg-status-completed"
        : "border-accent bg-accent";

  return (
    <>
      <p className="mt-2 text-sm text-muted sm:hidden">
        Swipe the timeline to see it all, and tap an event to open it.
      </p>
      <div className="-mx-6 mt-4 overflow-x-auto px-6 sm:mx-0 sm:mt-6 sm:px-0">
        <div
          ref={stageRef}
          className="relative transition-[height] duration-500 ease-out motion-reduce:transition-none"
          style={{
            minWidth: Math.max(MIN_WIDTH, events.length * MIN_PER_EVENT),
            height,
          }}
          onClick={(e) => {
            // A click on empty space closes the open event.
            if (e.target === e.currentTarget && selected !== null) close();
          }}
        >
          {/* Copies of the labels, measured to lay the real ones out. */}
          <div aria-hidden className="invisible absolute left-0 top-0">
            {events.map((e, i) => (
              <span
                key={e.key}
                ref={(el) => {
                  measureRefs.current[i] = el;
                }}
                className="absolute whitespace-nowrap px-1 text-center"
              >
                <span className="block text-sm font-semibold">{e.title}</span>
                <span className="block text-xs">
                  {e.planned && "Planned · "}
                  {formatEventDate(e)}
                </span>
              </span>
            ))}
          </div>

          {/* Stems and labels. They fade while an event is open. */}
          {geometry &&
            events.map((e, i) => {
              const label = geometry.labels[i];
              const x = pxAt(times[i], width);
              const offset = STEM + label.row * ROW;
              const labelTop =
                label.side === "above"
                  ? barTop - offset - LABEL_H
                  : barTop + BAND + offset;
              const stemTop =
                label.side === "above" ? labelTop + LABEL_H : barTop + LINE_Y;
              const stemBottom =
                label.side === "above" ? barTop + LINE_Y : labelTop;
              const hidden = openIndex !== null;

              return (
                <div
                  key={e.key}
                  className={`transition-opacity duration-300 ${hidden ? "pointer-events-none opacity-0" : ""}`}
                >
                  <span
                    className="absolute w-px bg-border-strong"
                    style={{
                      left: x,
                      top: stemTop,
                      height: Math.max(0, stemBottom - stemTop),
                    }}
                  />
                  <button
                    ref={(el) => {
                      labelRefs.current[i] = el;
                    }}
                    type="button"
                    aria-expanded={false}
                    tabIndex={hidden ? -1 : 0}
                    onClick={() => open(i)}
                    className="group absolute z-10 whitespace-nowrap rounded-md bg-background px-1 text-center"
                    style={{
                      left: label.left,
                      top: labelTop,
                      width: label.width,
                    }}
                  >
                    <span className="block text-sm font-semibold transition-colors group-hover:text-accent">
                      {e.title}
                    </span>
                    <span
                      className={`block text-xs ${e.planned ? "text-muted" : "text-foreground/70"}`}
                    >
                      {e.planned && "Planned · "}
                      {formatEventDate(e)}
                    </span>
                  </button>
                </div>
              );
            })}

          {/* The bar, with the year marks and a dot for each event. */}
          <div
            className="absolute inset-x-0 transition-[top] duration-500 ease-out motion-reduce:transition-none"
            style={{ top: barTop, height: BAND }}
          >
            <div
              className="absolute h-0.5 bg-border"
              style={{ top: LINE_Y - 1, left: PAD, right: PAD }}
            />
            <div
              className="absolute h-0.5 bg-accent"
              style={{
                top: LINE_Y - 1,
                left: PAD,
                width: `calc(${fraction(today ?? end)} * (100% - ${2 * PAD}px))`,
              }}
            />
            {today !== null && (
              <>
                {/* The stretch still to come, dashed. */}
                <div
                  className="absolute h-0.5 bg-[repeating-linear-gradient(to_right,var(--accent)_0_6px,transparent_6px_12px)]"
                  style={{ top: LINE_Y - 1, left: cssAt(today), right: PAD }}
                />
                <div
                  className="absolute h-4 w-px bg-foreground/60"
                  style={{ top: LINE_Y - 8, left: cssAt(today) }}
                />
                <span
                  className="label-caps absolute -translate-x-1/2 text-[0.6rem] text-muted"
                  style={{ top: LINE_Y + 8, left: cssAt(today) }}
                >
                  Today
                </span>
              </>
            )}

            {yearTicks(start, end).map((year, i, years) => {
              const time = Date.UTC(year, 0, 1);
              const x = pxAt(time, width);
              // Leave room for the "Today" mark, and drop a year that lands
              // too close to the one before where the bar is squeezed.
              const crowded =
                width > 0 &&
                ((today !== null && Math.abs(x - pxAt(today, width)) < 44) ||
                  (i > 0 &&
                    x - pxAt(Date.UTC(years[i - 1], 0, 1), width) < 40));

              return (
                !crowded && (
                  <span
                    key={year}
                    className="absolute -translate-x-1/2 font-mono text-xs text-muted"
                    style={{ top: LINE_Y + 6, left: cssAt(time) }}
                  >
                    {year}
                  </span>
                )
              );
            })}

            {events.map((e, i) => (
              <button
                key={e.key}
                type="button"
                tabIndex={-1}
                aria-label={`${e.title}, ${formatEventDate(e)}`}
                onClick={() => (selected === i ? close() : open(i))}
                className="group absolute -translate-x-1/2 -translate-y-1/2 p-1.5"
                style={{ top: LINE_Y, left: cssAt(times[i]) }}
              >
                <span
                  className={`block size-3 rounded-full border-2 transition-transform group-hover:scale-150 ${dotClasses(e)} ${selected === i ? "scale-150 ring-4 ring-accent/30" : ""}`}
                />
              </button>
            ))}
          </div>

          {/* The open event: a line from its dot, then the panel. */}
          {opened && openIndex !== null && (
            <>
              <span
                className="absolute w-px bg-accent transition-[top,height] duration-500 ease-out"
                style={
                  openSide === "above"
                    ? {
                        left: openX,
                        top: panelHeight,
                        height: Math.max(0, barTop + LINE_Y - panelHeight),
                      }
                    : {
                        left: openX,
                        top: LINE_Y,
                        height: Math.max(0, panelTop - LINE_Y),
                      }
                }
              />
              <div
                key={opened.key}
                ref={panelRef}
                role="region"
                aria-label={opened.title}
                tabIndex={-1}
                className="absolute rounded-xl border border-border-strong bg-surface p-5 shadow-lg outline-none"
                style={{ left: panelLeft, top: panelTop, width: panelWidth }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="label-caps text-muted">
                    {opened.planned && "Planned · "}
                    {formatEventDate(opened)}
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="-mr-2 -mt-2 rounded-lg px-2 text-xl leading-none text-muted hover:text-foreground"
                  >
                    ×
                  </button>
                </div>

                <h3 className="mt-1 animate-title-grow text-2xl font-semibold leading-tight motion-reduce:animate-none">
                  {opened.title}
                </h3>
                {opened.craft && (
                  <p className="label-caps mt-1.5 text-accent">
                    {opened.craft}
                  </p>
                )}
                {opened.description && (
                  <WrittenText text={opened.description} />
                )}

                <div className="mt-4 flex justify-between gap-4 text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    disabled={openIndex === 0}
                    className="text-left text-accent hover:underline disabled:invisible"
                  >
                    ← {openIndex > 0 && events[openIndex - 1].title}
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    disabled={openIndex === events.length - 1}
                    className="text-right text-accent hover:underline disabled:invisible"
                  >
                    {openIndex < events.length - 1 &&
                      events[openIndex + 1].title}{" "}
                    →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
