"use client";

import { GROUPS, type YearColumn } from "@/lib/data";
import { Legend, Tooltip, groupColour, usePointed, useWidth } from "./parts";

const HEIGHT = 260;
const MARGIN = { top: 10, right: 4, bottom: 26, left: 26 };

// A column for every year, each mission a block coloured by where it went,
// so the eras show: the race to the Moon, the run of missions to Mars. A
// year's column links to its missions in the archive.
export default function MissionsPerYear({ columns }: { columns: YearColumn[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { pointed, handlers, clear } = usePointed<number>();

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const most = Math.max(...columns.map(({ missions }) => missions.length));
  const step = plotWidth / columns.length;
  // How tall one mission's block is.
  const block = plotHeight / most;
  const ticks = Array.from({ length: most + 1 }, (_, i) => i).filter(
    (n) => most <= 6 || n % 2 === 0,
  );
  const column = pointed === null ? null : columns[pointed];

  return (
    <div className="space-y-4">
      <Legend
        items={GROUPS.map(({ key, label }) => ({
          label,
          color: groupColour(key),
        }))}
      />

      <div ref={ref} className="relative" onPointerDown={clear}>
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

            {columns.map(({ year, missions }, i) => {
              const x = MARGIN.left + i * step;
              const bar = Math.max(1.5, step * 0.7);

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

              if (missions.length === 0) return <g key={year}>{label}</g>;

              return (
                <g key={year}>
                  {label}
                  <a
                    href={`/missions?year=${year}`}
                    aria-label={`${year}: ${missions.map(({ name }) => name).join(", ")}`}
                    className="outline-none"
                    {...handlers(i)}
                  >
                    {/* The whole column answers to the pointer, not just
                        the blocks. */}
                    <rect
                      x={x}
                      y={MARGIN.top}
                      width={step}
                      height={plotHeight}
                      fill="transparent"
                    />
                    {pointed === i && (
                      <rect
                        x={x}
                        y={MARGIN.top}
                        width={step}
                        height={plotHeight}
                        fill="var(--border)"
                        opacity={0.5}
                      />
                    )}
                    {missions.map(({ slug, group }, k) => (
                      <rect
                        key={slug}
                        x={x + (step - bar) / 2}
                        y={MARGIN.top + plotHeight - (k + 1) * block + 1}
                        width={bar}
                        height={block - 2}
                        rx={1}
                        fill={groupColour(group)}
                      />
                    ))}
                  </a>
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
              {column.missions.map(({ slug, name, group }) => (
                <li key={slug} className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-sm"
                    style={{ background: groupColour(group) }}
                  />
                  {name}
                </li>
              ))}
            </ul>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
