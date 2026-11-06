"use client";

import { useState } from "react";
import type { MissionFacts } from "@/lib/data";
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

const HEIGHT = 300;
const MARGIN = { top: 12, right: 12, bottom: 26, left: 64 };

// Launch masses run from about 150 kg to over 15 tonnes, so the scale goes
// up in powers of ten.
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

// A dot for each mission at its launch date and launch mass. A dot links to
// its mission's page. The axes stay put as the filters change, so the dots
// that remain keep their places.
export default function LaunchMass({
  missions,
  first,
  last,
  unweighed,
}: {
  missions: MissionFacts[];
  // The decades the chart runs across.
  first: number;
  last: number;
  // How many of the filtered missions have no recorded mass.
  unweighed: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { pointed, handlers, clear } = usePointed<string>();
  const [mode, setMode] = useState<ColourBy>("where");

  const points = missions.filter(
    (mission): mission is MissionFacts & { massKg: number } =>
      mission.massKg !== null,
  );
  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
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
  const lightest = points.reduce<(typeof points)[number] | null>(
    (a, b) => (!a || b.massKg < a.massKg ? b : a),
    null,
  );
  const heaviest = points.reduce<(typeof points)[number] | null>(
    (a, b) => (!a || b.massKg > a.massKg ? b : a),
    null,
  );

  return (
    <Card
      label="Size"
      title="Launch mass"
      controls={
        <Switch
          label="Colour by"
          options={COLOUR_OPTIONS}
          value={mode}
          onChange={setMode}
        />
      }
    >
      <p className="max-w-3xl text-sm text-muted">
        {lightest && heaviest && lightest !== heaviest
          ? `From ${lightest.name} at ${massFormat(lightest.massKg)} to ${heaviest.name} at ${massFormat(heaviest.massKg)}. `
          : ""}
        The scale grows by powers of ten: from 100 kg to 1,000 kg takes as much
        room as from 1,000 kg to 10,000 kg. A mission&rsquo;s mass is its
        spacecraft&rsquo;s launch masses added up, as the catalogue records
        them, so a rover catalogued on its own, such as Spirit, appears
        without its cruise stage.
        {unweighed > 0 &&
          ` ${unweighed} mission${unweighed === 1 ? " has" : "s have"} no recorded mass.`}
      </p>

      <div className="mt-4">
        <Legend items={COLOURINGS[mode].items} />
      </div>

      <div ref={ref} className="relative mt-4" onPointerDown={clear}>
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

            {points.map((mission) => {
              const cx = x(yearOf(mission.launchDate));
              const cy = y(mission.massKg);

              return (
                <a
                  key={mission.slug}
                  href={`/missions/${mission.slug}`}
                  aria-label={`${mission.name}: ${massFormat(mission.massKg)}, launched ${dayFormat.format(new Date(mission.launchDate))}`}
                  className="outline-none"
                  {...handlers(mission.slug)}
                >
                  {/* A wider ring than the dot answers to the pointer. */}
                  <circle cx={cx} cy={cy} r={10} fill="transparent" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={pointed === mission.slug ? 7 : 5}
                    fill={colourOf(mission, mode).colour}
                    stroke="var(--surface)"
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
    </Card>
  );
}
