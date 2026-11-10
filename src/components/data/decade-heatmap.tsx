"use client";

import { useState } from "react";
import { GROUPS, type Filters, type Group, type MissionFacts } from "@/lib/data";
import { Tooltip, usePointed, useWidth } from "./parts";

// A square for each group of destinations in each decade, shaded by how
// many missions went there then: where the attention went, decade by
// decade. Clicking a square narrows the page to that group and decade.
export default function DecadeHeatmap({
  missions,
  decades,
  filters,
  onPick,
}: {
  // The missions the other filters allow.
  missions: MissionFacts[];
  decades: number[];
  filters: Filters;
  onPick: (group: Group, decade: number) => void;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { pointed, handlers, clear, hint } = usePointed<string>();
  const [at, setAt] = useState({ x: 0, y: 0 });

  const cell = (group: Group, decade: number) =>
    missions.filter(
      (mission) =>
        mission.group === group &&
        mission.launchYear >= decade &&
        mission.launchYear < decade + 10,
    );
  const most = Math.max(
    1,
    ...GROUPS.flatMap(({ key }) =>
      decades.map((decade) => cell(key, decade).length),
    ),
  );
  // Whether a square is within the page's filters, and whether it is the
  // one they were set to.
  const chosen = (group: Group, decade: number) =>
    (filters.where.length === 0 || filters.where.includes(group)) &&
    (!filters.years ||
      (filters.years[0] < decade + 10 && filters.years[1] >= decade));
  const picked = (group: Group, decade: number) =>
    filters.where.length === 1 &&
    filters.where[0] === group &&
    filters.places.length === 0 &&
    filters.years?.[0] === decade &&
    filters.years?.[1] === decade + 9;
  const pointedAt = pointed?.split(":") as [Group, string] | undefined;
  const shown = pointedAt && {
    group: GROUPS.find(({ key }) => key === pointedAt[0])!,
    decade: Number(pointedAt[1]),
    missions: cell(pointedAt[0], Number(pointedAt[1])),
  };

  function place(event: React.SyntheticEvent<HTMLElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const origin = ref.current!.getBoundingClientRect();

    setAt({
      x: box.left + box.width / 2 - origin.left,
      y: box.top - origin.top,
    });
  }

  return (
    <div ref={ref} className="relative" onPointerDown={clear}>
      <div
        className="grid gap-1 text-xs"
        style={{
          gridTemplateColumns: `minmax(5.5rem, 11rem) repeat(${decades.length}, minmax(0, 1fr))`,
        }}
      >
        <span />
        {decades.map((decade) => (
          <span
            key={decade}
            className="pb-1 text-center font-mono text-[11px] text-muted"
          >
            <span className="hidden sm:inline">{decade}s</span>
            <span className="sm:hidden">’{String(decade).slice(2)}</span>
          </span>
        ))}

        {GROUPS.map(({ key, label }) => (
          <div key={key} className="contents">
            <span className="flex items-center gap-1.5 pr-1 text-sm">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-sm"
                style={{ background: `var(--chart-${key})` }}
              />
              <span className="truncate" title={label}>
                {label}
              </span>
            </span>

            {decades.map((decade) => {
              const count = cell(key, decade).length;
              const id = `${key}:${decade}`;
              const { onPointerEnter, onFocus, onPointerDown, ...rest } =
                handlers(id, () => onPick(key, decade));

              if (count === 0) {
                return (
                  <span
                    key={decade}
                    className="h-9 rounded border border-dashed border-border"
                  />
                );
              }

              return (
                <button
                  key={decade}
                  type="button"
                  aria-pressed={picked(key, decade)}
                  aria-label={`${label}, ${decade}s: ${count} mission${count === 1 ? "" : "s"}`}
                  {...rest}
                  onPointerEnter={(event) => {
                    place(event);
                    onPointerEnter(event);
                  }}
                  onFocus={(event) => {
                    place(event);
                    onFocus();
                  }}
                  onPointerDown={(event) => {
                    place(event);
                    onPointerDown(event);
                  }}
                  className={`h-9 rounded font-mono text-foreground tabular-nums outline-none transition focus-visible:ring-2 focus-visible:ring-accent ${
                    picked(key, decade) || pointed === id
                      ? "ring-2 ring-accent"
                      : ""
                  } ${chosen(key, decade) ? "" : "opacity-30"}`}
                  style={{
                    background: `color-mix(in srgb, var(--accent) ${Math.round(10 + (80 * count) / most)}%, transparent)`,
                  }}
                >
                  <span
                    className={
                      count / most > 0.6 ? "font-semibold text-background" : ""
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {shown && (
        <Tooltip x={at.x} y={at.y} width={width}>
          <p className="font-semibold">
            {shown.group.label} · {shown.decade}s
          </p>
          <p className="text-muted">
            {shown.missions
              .slice(0, 6)
              .map(({ name }) => name)
              .join(", ")}
            {shown.missions.length > 6 &&
              ` and ${shown.missions.length - 6} more`}
          </p>
          <p className="mt-1.5 text-xs text-muted">
            {hint(picked(shown.group.key, shown.decade))}
          </p>
        </Tooltip>
      )}
    </div>
  );
}
