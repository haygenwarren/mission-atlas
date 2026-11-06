"use client";

import { useState } from "react";
import { missionsByYear, type MissionFacts } from "@/lib/data";
import {
  COLOURINGS,
  COLOUR_OPTIONS,
  Card,
  Legend,
  Switch,
  Tooltip,
  colourOf,
  usePointed,
  useWidth,
  type ColourBy,
} from "./parts";

const HEIGHT = 260;
const MARGIN = { top: 10, right: 4, bottom: 26, left: 26 };

// A column for every year, each mission a block, so the eras show: the race
// to the Moon, the run of missions to Mars. Clicking a year narrows the page
// to it. The chart shows every year the other filters allow, with the
// chosen years picked out.
export default function MissionsPerYear({
  missions,
  first,
  last,
  years,
  onPick,
}: {
  missions: MissionFacts[];
  // The years the chart runs across.
  first: number;
  last: number;
  // The years chosen, if any.
  years: [number, number] | null;
  onPick: (year: number) => void;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { pointed, handlers, clear, hint } = usePointed<number>();
  const [mode, setMode] = useState<ColourBy>("where");

  const columns = missionsByYear(missions, first, last);
  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const most = Math.max(1, ...columns.map(({ missions }) => missions.length));
  const step = plotWidth / columns.length;
  // How tall one mission's block is.
  const block = plotHeight / most;
  const ticks = Array.from({ length: most + 1 }, (_, i) => i).filter(
    (n) => most <= 6 || n % 2 === 0,
  );
  const chosen = (year: number) =>
    !years || (year >= years[0] && year <= years[1]);
  const picked = (year: number) =>
    years !== null && years[0] === year && years[1] === year;
  const column = pointed === null ? null : columns[pointed];

  return (
    <Card
      label="Launches"
      title="Missions per year"
      controls={
        <Switch
          label="Colour by"
          options={COLOUR_OPTIONS}
          value={mode}
          onChange={setMode}
        />
      }
    >
      <Legend items={COLOURINGS[mode].items} />

      <div ref={ref} className="relative mt-4" onPointerDown={clear}>
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="group"
            aria-label="Missions launched each year"
            className="overflow-visible"
          >
            {ticks.map((n) => {
              const y = MARGIN.top + plotHeight - n * block;

              return (
                <g key={n}>
                  <line
                    x1={MARGIN.left}
                    x2={width - MARGIN.right}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                  />
                  <text
                    x={MARGIN.left - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-muted font-mono text-[11px]"
                  >
                    {n}
                  </text>
                </g>
              );
            })}

            {columns.map(({ year, missions: launched }, i) => {
              const x = MARGIN.left + i * step;
              const bar = Math.max(1.5, step * 0.7);
              const stack = launched
                .map((mission) => ({ mission, ...colourOf(mission, mode) }))
                .sort((a, b) => a.order - b.order);

              // A decade's first year is named below the axis.
              const label = year % 10 === 0 && (
                <text
                  x={x + step / 2}
                  y={HEIGHT - 6}
                  textAnchor="middle"
                  className="fill-muted font-mono text-[11px]"
                >
                  {year}
                </text>
              );

              if (launched.length === 0) return <g key={year}>{label}</g>;

              return (
                <g key={year}>
                  {label}
                  <g
                    role="button"
                    tabIndex={0}
                    aria-pressed={picked(year)}
                    aria-label={`${year}: ${launched.map(({ name }) => name).join(", ")}`}
                    className="cursor-pointer outline-none"
                    opacity={chosen(year) ? 1 : 0.3}
                    {...handlers(i, () => onPick(year), true)}
                  >
                    {/* The whole column answers to the pointer, not just
                        the blocks. */}
                    <rect
                      x={x}
                      y={MARGIN.top}
                      width={step}
                      height={plotHeight}
                      fill={pointed === i ? "var(--border)" : "transparent"}
                      opacity={0.5}
                    />
                    {stack.map(({ mission, colour }, k) => (
                      <rect
                        key={mission.slug}
                        x={x + (step - bar) / 2}
                        y={MARGIN.top + plotHeight - (k + 1) * block + 1}
                        width={bar}
                        height={block - 2}
                        rx={1}
                        fill={colour}
                      />
                    ))}
                  </g>
                </g>
              );
            })}
          </svg>
        )}

        {column && (
          <Tooltip
            x={MARGIN.left + (pointed! + 0.5) * step}
            y={MARGIN.top + plotHeight - column.missions.length * block}
            width={width}
          >
            <p className="font-semibold">
              {column.year} · {column.missions.length} mission
              {column.missions.length === 1 ? "" : "s"}
            </p>
            <ul className="mt-1 space-y-0.5">
              {column.missions.map((mission) => (
                <li key={mission.slug} className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-sm"
                    style={{ background: colourOf(mission, mode).colour }}
                  />
                  {mission.name}
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-xs text-muted">
              {hint(picked(column.year))}
            </p>
          </Tooltip>
        )}
      </div>
    </Card>
  );
}
