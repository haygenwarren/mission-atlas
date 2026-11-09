"use client";

import { useEffect, useRef, useState } from "react";
import {
  AGENCY_GROUPS,
  GROUPS,
  STATUSES,
  agencyGroupOf,
  type MissionFacts,
} from "@/lib/data";
import { statusLabels } from "@/lib/missions";

// What the data page's cards share: their frame and switches, their width,
// how they colour missions, and the note shown beside what is pointed at.

// The width of the element `ref` is put on, kept up to date as it changes.
// Charts are drawn at their real width, so text stays its proper size on a
// phone.
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );

    observer.observe(ref.current!);

    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

// Which item of a chart is pointed at, and the handlers each item needs:
// the mouse over it or the keyboard on it shows its note, and a click acts
// (filters the page, or follows a link). On a touch screen the first tap
// shows the note and a second acts.
export function usePointed<T extends string | number>() {
  const [pointed, setPointed] = useState<T | null>(null);
  // Whether the last press was a finger, for the note's wording.
  const [byTouch, setByTouch] = useState(false);
  const touch = useRef(false);
  // Whether the item was already showing its note when the tap began: a tap
  // also focuses the item, which shows the note before the click arrives.
  const showing = useRef(false);

  const handlers = (
    item: T,
    act: () => void = () => {},
    // For an item drawn in SVG that acts as a button, Enter and Space act.
    keys = false,
  ) => ({
    onPointerDown: (event: React.PointerEvent) => {
      touch.current = event.pointerType !== "mouse";
      showing.current = pointed === item;
      setByTouch(touch.current);
    },
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") setPointed(item);
    },
    onPointerLeave: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") setPointed(null);
    },
    onFocus: () => setPointed(item),
    onBlur: () => setPointed(null),
    onClick: (event: React.MouseEvent) => {
      if (touch.current && !showing.current) {
        event.preventDefault();
        showing.current = true;
        setPointed(item);
        return;
      }

      act();
    },
    ...(keys && {
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          act();
        }
      },
    }),
  });

  // A tap on the chart away from its items puts the note away.
  const clear = (event: React.PointerEvent) => {
    if (!(event.target as Element).closest("a, button, [role=button]")) {
      setPointed(null);
    }
  };

  // What a note says to do next.
  const hint = (picked: boolean) =>
    `${byTouch ? "Tap again" : "Click"} to ${picked ? "clear this filter" : "show only these"}`;

  return { pointed, handlers, clear, hint };
}

// A note above the point (x, y) of a chart `width` wide. It slides from
// the left of the point to the right as the point crosses the chart, so it
// never runs off either side.
export function Tooltip({
  x,
  y,
  width,
  children,
}: {
  x: number;
  y: number;
  width: number;
  children: React.ReactNode;
}) {
  const share = width > 0 ? Math.min(1, Math.max(0, x / width)) : 0.5;

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 w-max max-w-64 rounded-lg border border-border-strong bg-background px-3 py-2 text-sm shadow-lg"
      style={{
        left: x,
        top: y,
        transform: `translate(-${share * 100}%, calc(-100% - 10px))`,
      }}
    >
      {children}
    </div>
  );
}

export function Legend({
  items,
}: {
  items: { label: string; colour: string }[];
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
      {items.map(({ label, colour }) => (
        <li key={label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-sm"
            style={{ background: colour }}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}

// A card on the dashboard: its name, a note on how to read it behind an
// ⓘ, any switches beside it, and the chart.
export function Card({
  label,
  note,
  controls,
  children,
}: {
  label: string;
  note?: React.ReactNode;
  controls?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="relative flex min-h-7 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="label-caps text-muted">{label}</h2>
          {note && <Note label={label}>{note}</Note>}
        </div>
        {controls}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// An ⓘ that shows a card's note: while the mouse is over it, or once
// clicked or tapped until a click elsewhere or Escape. The note opens
// below the card's heading, from the card's left edge, so it stays on
// screen on a phone.
function Note({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const id = `note-${label.toLowerCase().replace(/\W+/g, "-")}`;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (!ref.current?.contains(target) && !noteRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={`About ${label.toLowerCase()}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setHovered(false);
        }}
        className={`flex size-5 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          open ? "text-foreground" : "text-muted hover:text-foreground"
        }`}
      >
        <svg
          viewBox="0 0 16 16"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden
        >
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 7.2v4" strokeLinecap="round" />
          <circle cx="8" cy="4.9" r="0.4" fill="currentColor" />
        </svg>
      </button>
      <div
        ref={noteRef}
        id={id}
        role="note"
        hidden={!open && !hovered}
        className="absolute top-full left-0 z-20 mt-2 w-max max-w-[min(24rem,100%)] space-y-2 rounded-lg border border-border-strong bg-background px-3 py-2.5 text-sm text-muted shadow-lg"
      >
        {children}
      </div>
    </>
  );
}

// A row of buttons that picks one of a few ways to show a card.
export function Switch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex rounded-full border border-border-strong p-0.5 text-xs"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3 py-1 transition-colors ${
            value === option.value
              ? "bg-border-strong text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Ways to colour missions, each with its legend and each mission's colour.
export type ColourBy = "where" | "agency" | "status";

const agencyColours: Record<string, string> = {
  nasa: "var(--chart-outer)",
  esa: "var(--chart-telescopes)",
  russia: "var(--chart-mars)",
  jaxa: "var(--chart-small)",
  cnsa: "var(--chart-inner)",
  isro: "var(--chart-moon)",
  others: "var(--status-completed)",
};

export const COLOURINGS: Record<
  ColourBy,
  {
    label: string;
    items: { key: string; label: string; colour: string }[];
    of: (mission: MissionFacts) => string;
  }
> = {
  where: {
    label: "Where it went",
    items: GROUPS.map(({ key, label }) => ({
      key,
      label,
      colour: `var(--chart-${key})`,
    })),
    of: (mission) => mission.group,
  },
  agency: {
    label: "Agency",
    items: AGENCY_GROUPS.map(({ key, label }) => ({
      key,
      label,
      colour: agencyColours[key],
    })),
    of: agencyGroupOf,
  },
  status: {
    label: "Status",
    items: STATUSES.map((status) => ({
      key: status,
      label: statusLabels[status],
      colour: `var(--status-${status.toLowerCase()})`,
    })),
    of: (mission) => mission.status,
  },
};

export const COLOUR_OPTIONS = (Object.keys(COLOURINGS) as ColourBy[]).map(
  (value) => ({
    value,
    label: { where: "Where", agency: "Agency", status: "Status" }[value],
  }),
);

// A mission's colour, and where it comes in a stack, when coloured by
// `mode`.
export function colourOf(mission: MissionFacts, mode: ColourBy) {
  const { items, of } = COLOURINGS[mode];
  const key = of(mission);
  const index = items.findIndex((item) => item.key === key);

  return { colour: items[index].colour, order: index };
}
