"use client";

import { useEffect, useRef, useState } from "react";

// What the data page's charts share: their width, the note shown beside
// what is pointed at, and a legend.

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

// Which item of a chart is pointed at, and what each item's link needs to
// show it: the mouse over it or the keyboard on it shows its note. On a
// touch screen the first tap shows the note and a second follows the link.
export function usePointed<T extends string | number>() {
  const [pointed, setPointed] = useState<T | null>(null);
  const touch = useRef(false);
  // Whether the item was already showing its note when the tap began: a tap
  // also focuses the link, which shows the note before the click arrives.
  const showing = useRef(false);

  const handlers = (item: T) => ({
    onPointerDown: (event: React.PointerEvent) => {
      touch.current = event.pointerType !== "mouse";
      showing.current = pointed === item;
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
      }
    },
  });

  // A tap on the chart away from its items puts the note away.
  const clear = (event: React.PointerEvent) => {
    if (!(event.target as Element).closest("a")) setPointed(null);
  };

  return { pointed, handlers, clear };
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
      className="pointer-events-none absolute z-10 w-max max-w-64 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm shadow-lg"
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
  items: { label: string; color: string }[];
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
      {items.map(({ label, color }) => (
        <li key={label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-sm"
            style={{ background: color }}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}

// A group's colour, from the theme.
export const groupColour = (group: string) => `var(--chart-${group})`;
