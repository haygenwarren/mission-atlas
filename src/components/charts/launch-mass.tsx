"use client";

import { GROUPS, type MassPoint } from "@/lib/data";
import { Legend, Tooltip, groupColour, usePointed, useWidth } from "./parts";

const HEIGHT = 300;
const MARGIN = { top: 12, right: 12, bottom: 26, left: 64 };

// Launch masses run from about 150 kg to over 15 tonnes, so the scale goes
// up in powers of ten: each step up is ten times heavier.
const LOWEST_KG = 100;
const HIGHEST_KG = 20_000;
const MASS_TICKS = [100, 300, 1_000, 3_000, 10_000];

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const massFormat = (kg: number) =>
  `${Math.round(kg).toLocaleString("en-GB")} kg`;

// A year as a number with a fraction, so dots fall where in the year the
// launch was.
function yearOf(iso: string) {
  const date = new Date(iso);
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const end = Date.UTC(date.getUTCFullYear() + 1, 0, 1);

  return date.getUTCFullYear() + (date.getTime() - start) / (end - start);
}

// A dot for each mission at its launch date and launch mass, coloured by
// where it went. A dot links to its mission's page.
export default function LaunchMass({ points }: { points: MassPoint[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { pointed, handlers, clear } = usePointed<string>();

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const years = points.map(({ launchDate }) => yearOf(launchDate));
  // Whole decades either side of the launches.
  const first = Math.floor(Math.min(...years) / 10) * 10;
  const last = Math.ceil(Math.max(...years) / 10) * 10;
  const x = (year: number) =>
    MARGIN.left + ((year - first) / (last - first)) * plotWidth;
  const y = (kg: number) =>
    MARGIN.top +
    plotHeight *
      (1 -
        (Math.log10(kg) - Math.log10(LOWEST_KG)) /
          (Math.log10(HIGHEST_KG) - Math.log10(LOWEST_KG)));
  const decades = Array.from(
    { length: (last - first) / 10 + 1 },
    (_, i) => first + i * 10,
  );
  const point = points.find(({ slug }) => slug === pointed);

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
            aria-label="Launch mass of each mission, by launch date"
            className="overflow-visible"
          >
            {MASS_TICKS.map((kg) => (
              <g key={kg}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={y(kg)}
                  y2={y(kg)}
                  stroke="var(--border)"
                />
                <text
                  x={MARGIN.left - 8}
                  y={y(kg)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted font-mono text-[11px]"
                >
                  {massFormat(kg)}
                </text>
              </g>
            ))}

            {decades.map((decade) => (
              <text
                key={decade}
                x={x(decade)}
                y={HEIGHT - 6}
                textAnchor="middle"
                className="fill-muted font-mono text-[11px]"
              >
                {decade}
              </text>
            ))}

            {points.map(({ slug, name, group, launchDate, massKg }, i) => {
              const cx = x(years[i]);
              const cy = y(massKg);

              return (
                <a
                  key={slug}
                  href={`/missions/${slug}`}
                  aria-label={`${name}: ${massFormat(massKg)}, launched ${dayFormat.format(new Date(launchDate))}`}
                  className="outline-none"
                  {...handlers(slug)}
                >
                  {/* A wider ring than the dot answers to the pointer. */}
                  <circle cx={cx} cy={cy} r={10} fill="transparent" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={pointed === slug ? 7 : 5}
                    fill={groupColour(group)}
                    stroke="var(--background)"
                    strokeWidth={1.5}
                  />
                </a>
              );
            })}
          </svg>
        )}

        {point && (
          <Tooltip
            x={x(yearOf(point.launchDate))}
            y={y(point.massKg) - 6}
            width={width}
          >
            <p className="font-semibold">{point.name}</p>
            <p className="text-muted">
              {massFormat(point.massKg)} · launched{" "}
              {dayFormat.format(new Date(point.launchDate))}
            </p>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
