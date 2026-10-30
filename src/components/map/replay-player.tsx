"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { Journey } from "@/lib/journey";
import { dayToDate } from "@/lib/map-scene";
import type { Days } from "@/lib/orbits";

// How long a replay takes at normal speed, however long the mission.
const REPLAY_MS = 30_000;

const SPEEDS = [
  { value: 0.5, label: "½×" },
  { value: 1, label: "1×" },
  { value: 2, label: "2×" },
  { value: 4, label: "4×" },
];

// How long a tapped milestone's name stays up, in milliseconds.
const TAPPED_MS = 2500;

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type Props = {
  journey: Journey;
  name: string;
  // Where the craft is at time t, in words.
  describe: (t: Days) => string;
  // How long to wait before playing, while the map flies to the journey.
  delay: number;
  // Called with the replay's time whenever it changes.
  onTime: (t: Days) => void;
  onClose: () => void;
  ref?: React.Ref<HTMLDivElement>;
};

// The controls for a replay, along the bottom of the map: play and pause,
// the date, a scrubber with the mission's milestones marked above it, and
// the speed.
export default function ReplayPlayer({
  journey,
  name,
  describe,
  delay,
  onTime,
  onClose,
  ref,
}: Props) {
  const { from, until, markers } = journey;
  const [t, setT] = useState(from);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  // The milestone whose name shows above its mark: under the mouse,
  // focused, or just tapped.
  const [shown, setShown] = useState<number | null>(null);
  const time = useRef(from);
  const trackRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const startTimer = useRef<number>(undefined);
  const hideTimer = useRef<number>(undefined);
  // Whether it was playing when a drag along the scrubber began.
  const resume = useRef(false);

  const share = (day: Days) => (day - from) / (until - from);
  const ended = t >= until;

  function seek(day: Days) {
    const next = Math.min(until, Math.max(from, day));

    time.current = next;
    setT(next);
    onTime(next);
  }

  // Moves the replay on by `elapsed` milliseconds of playing. Returns
  // whether there is more to play.
  const advance = useEffectEvent((elapsed: number) => {
    seek(time.current + (elapsed * speed * (until - from)) / REPLAY_MS);

    if (time.current < until) return true;

    setPlaying(false);
    return false;
  });

  useEffect(() => {
    if (!playing) return;

    let frame = 0;
    let last: number | null = null;

    function step(now: number) {
      const more = advance(last === null ? 0 : now - last);

      last = now;
      if (more) frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // The player takes the keyboard focus from the button that started it,
  // which is gone, so Escape and Space work straight away.
  useEffect(() => playRef.current?.focus(), []);

  // Starts playing once the map has flown to the journey.
  useEffect(() => {
    startTimer.current = window.setTimeout(() => setPlaying(true), delay);

    return () => clearTimeout(startTimer.current);
  }, [delay]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  function togglePlay() {
    clearTimeout(startTimer.current);

    if (playing) {
      setPlaying(false);
    } else {
      if (ended) seek(from);
      setPlaying(true);
    }
  }

  function show(marker: number | null, forMs?: number) {
    clearTimeout(hideTimer.current);
    setShown(marker);

    if (forMs) {
      hideTimer.current = window.setTimeout(() => setShown(null), forMs);
    }
  }

  function seekToPointer(clientX: number) {
    const box = trackRef.current!.getBoundingClientRect();

    seek(from + ((clientX - box.left) / box.width) * (until - from));
  }

  function onTrackKey(event: React.KeyboardEvent) {
    const step = (until - from) / 100;
    const moves: Record<string, number> = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: step * 10,
      PageDown: -step * 10,
    };

    if (event.key === "Home") seek(from);
    else if (event.key === "End") seek(until);
    else if (moves[event.key]) seek(time.current + moves[event.key]);
    else return;

    event.preventDefault();
  }

  const marker = shown === null ? null : markers[shown];
  const date = dateFormat.format(dayToDate(t));

  return (
    <div
      ref={ref}
      role="region"
      aria-label={`Replay of ${name}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      className="absolute inset-x-3 bottom-3 mx-auto max-w-2xl rounded-xl border border-border bg-surface/95 px-4 pb-3 pt-3.5 shadow-xl backdrop-blur sm:inset-x-4 sm:bottom-4 sm:px-5"
    >
      <div className="flex items-start gap-3">
        <button
          ref={playRef}
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : ended ? "Play again" : "Play"}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-button text-button-text transition-opacity hover:opacity-90"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
            {playing ? (
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            ) : ended ? (
              <path
                d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path d="M7 4.5v15L19.5 12z" />
            )}
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <p className="label-caps truncate text-muted">Replay · {name}</p>
          <p className="mt-1 flex flex-wrap gap-x-2 text-sm">
            <span className="font-semibold tabular-nums">{date}</span>
            <span className="text-muted tabular-nums">{describe(t)}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close the replay"
          className="-mr-1 rounded-lg px-2 text-xl leading-none text-muted hover:text-foreground"
        >
          ×
        </button>
      </div>

      {/* The milestones, marked above the scrubber: filled in once passed. */}
      <div className="relative mx-2 mt-3 h-4">
        {markers.map((one, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${one.title}, ${one.date}`}
            onClick={() => seek(one.t)}
            onPointerDown={(event) => {
              if (event.pointerType !== "mouse") show(i, TAPPED_MS);
            }}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") show(i);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") show(null);
            }}
            onFocus={() => show(i)}
            onBlur={() => show(null)}
            className="absolute top-0 grid h-4 w-4 -translate-x-1/2 place-items-center"
            style={{ left: `${share(one.t) * 100}%` }}
          >
            <span
              className={`size-2 rotate-45 transition-transform ${
                one.t <= t ? "bg-accent" : "bg-border-strong"
              } ${shown === i ? "scale-150" : ""}`}
            />
          </button>
        ))}

        {/* Slides from the left edge to the right as the mark does, so it
            never runs off the player. */}
        {marker && (
          <p
            className="pointer-events-none absolute bottom-full mb-1.5 max-w-full truncate rounded-md border border-border-strong bg-background px-2 py-1 text-xs shadow-lg"
            style={{
              left: `${share(marker.t) * 100}%`,
              transform: `translateX(-${share(marker.t) * 100}%)`,
            }}
          >
            <span className="font-semibold">{marker.title}</span>
            <span className="text-muted"> · {marker.date}</span>
          </p>
        )}
      </div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Replay date"
        aria-valuemin={from}
        aria-valuemax={until}
        aria-valuenow={t}
        aria-valuetext={date}
        onKeyDown={onTrackKey}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          clearTimeout(startTimer.current);
          resume.current = playing;
          setPlaying(false);
          seekToPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            seekToPointer(event.clientX);
          }
        }}
        onPointerUp={() => {
          if (resume.current && time.current < until) setPlaying(true);
          resume.current = false;
        }}
        className="group relative mx-2 h-5 cursor-pointer touch-none outline-none"
      >
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border-strong" />
        <span
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent"
          style={{ width: `${share(t) * 100}%` }}
        />
        <span
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent group-focus-visible:ring-2 group-focus-visible:ring-accent"
          style={{ left: `${share(t) * 100}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted">
        <span className="tabular-nums">{dateFormat.format(dayToDate(from))}</span>
        <div role="group" aria-label="Speed" className="flex gap-1">
          {SPEEDS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={speed === option.value}
              onClick={() => setSpeed(option.value)}
              className={`rounded px-1.5 py-0.5 transition-colors ${
                speed === option.value
                  ? "bg-border-strong text-foreground"
                  : "hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="tabular-nums">
          {journey.toToday ? "Today" : dateFormat.format(dayToDate(until))}
        </span>
      </div>

      {journey.lateStart && (
        <p className="mt-2 text-xs text-muted">
          JPL Horizons has its path only from{" "}
          {dateFormat.format(dayToDate(from))}, so the replay starts there.
        </p>
      )}
    </div>
  );
}
