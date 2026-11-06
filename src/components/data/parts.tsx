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

// A card on the dashboard: what it shows, with any switches beside it.
export function Card({
  label,
  title,
  controls,
  children,
}: {
  label: string;
  title: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label-caps text-muted">{label}</p>
          <h2 className="mt-1 text-lg font-semibold">{title}</h2>
        </div>
        {controls}
      </div>
      <div className="mt-4">{children}</div>
    </section>
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
