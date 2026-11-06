"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  GROUPS,
  NO_FILTERS,
  STATUSES,
  archiveHref,
  hasFilters,
  missionsByAgency,
  type Filters,
  type MissionFacts,
} from "@/lib/data";
import { statusLabels } from "@/lib/missions";

type Panel = "where" | "agency" | "years";

// Smaller on phones, so the bar takes two rows rather than three.
const pillClasses = (on: boolean) =>
  `rounded-full border px-2.5 py-1 text-xs transition-colors sm:px-3 sm:text-sm ${
    on
      ? "border-accent bg-accent/15 text-foreground"
      : "border-border-strong text-muted hover:border-accent hover:text-foreground"
  }`;

// A list of names, shortened past two.
function summary(names: string[]) {
  if (names.length === 0) return "All";
  if (names.length <= 2) return names.join(", ");

  return `${names.length} chosen`;
}

// The filters along the top of the data page, staying in view as it
// scrolls: status as a row of buttons, and where it went, agency and launch
// years each as a button that opens a panel of choices. Then how many
// missions match, a way to clear the filters, and the same missions in the
// archive when its filters can say the same.
export default function FilterBar({
  missions,
  filters,
  shown,
  onChange,
}: {
  missions: MissionFacts[];
  filters: Filters;
  shown: number;
  onChange: (filters: Filters) => void;
}) {
  const [open, setOpen] = useState<Panel | null>(null);
  // Panels near the right edge open leftwards, so they stay on screen.
  const [alignRight, setAlignRight] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const years = missions.map(({ launchYear }) => launchYear);
  const first = Math.min(...years);
  const last = Math.max(...years);
  const [from, to] = filters.years ?? [first, last];
  const agencies = missionsByAgency(missions);
  const placeNames = new Map(
    missions.flatMap(({ destinations }) =>
      destinations.map(({ slug, name }) => [slug, name] as const),
    ),
  );
  const archive = hasFilters(filters) ? archiveHref(filters) : null;

  // A click outside the bar or Escape closes an open panel.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!barRef.current?.contains(event.target as Node)) setOpen(null);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle(panel: Panel, event: React.MouseEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect();

    setAlignRight(box.left + box.width / 2 > window.innerWidth / 2);
    setOpen(open === panel ? null : panel);
  }

  const toggled = <T,>(list: T[], item: T) =>
    list.includes(item) ? list.filter((one) => one !== item) : [...list, item];

  function setYears(next: [number, number] | null) {
    onChange({
      ...filters,
      years:
        next && (next[0] !== first || next[1] !== last) ? next : null,
    });
  }

  // A button that opens a panel, saying what is chosen.
  const chip = (panel: Panel, label: string, value: string, on: boolean) => (
    <button
      type="button"
      aria-expanded={open === panel}
      onClick={(event) => toggle(panel, event)}
      className={`${pillClasses(on)} flex max-w-60 items-center gap-1.5`}
    >
      <span className="text-muted">{label}:</span>
      <span className="truncate">{value}</span>
      <svg
        viewBox="0 0 12 12"
        className="size-3 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M3 4.5 6 7.5 9 4.5" />
      </svg>
    </button>
  );

  const panelClasses = `absolute top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border-strong bg-surface p-4 shadow-xl ${
    alignRight ? "right-0" : "left-0"
  }`;

  return (
    <div
      ref={barRef}
      className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-2 px-6 py-2.5 sm:gap-x-3 sm:py-3">
        <div role="radiogroup" aria-label="Status" className="flex gap-1">
          {[null, ...STATUSES].map((status) => (
            <button
              key={status ?? "all"}
              type="button"
              role="radio"
              aria-checked={filters.status === status}
              onClick={() => onChange({ ...filters, status })}
              className={pillClasses(filters.status === status)}
            >
              {status ? statusLabels[status] : "All"}
            </button>
          ))}
        </div>

        <div className="relative">
          {chip(
            "where",
            "Where",
            summary([
              ...GROUPS.filter(({ key }) => filters.where.includes(key)).map(
                ({ label }) => label,
              ),
              ...filters.places.map((slug) => placeNames.get(slug) ?? slug),
            ]),
            filters.where.length + filters.places.length > 0,
          )}
          {open === "where" && (
            <div className={panelClasses}>
              <p className="label-caps text-muted">Where it went</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {GROUPS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={filters.where.includes(key)}
                    onClick={() =>
                      onChange({
                        ...filters,
                        where: toggled(filters.where, key),
                      })
                    }
                    className={`${pillClasses(filters.where.includes(key))} flex items-center gap-1.5`}
                  >
                    <span
                      aria-hidden
                      className="size-2.5 rounded-sm"
                      style={{ background: `var(--chart-${key})` }}
                    />
                    {label}
                  </button>
                ))}
              </div>
              {filters.places.length > 0 && (
                <>
                  <p className="label-caps mt-4 text-muted">Places</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {filters.places.map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        aria-label={`Remove ${placeNames.get(slug) ?? slug}`}
                        onClick={() =>
                          onChange({
                            ...filters,
                            places: filters.places.filter((one) => one !== slug),
                          })
                        }
                        className={pillClasses(true)}
                      >
                        {placeNames.get(slug) ?? slug} ×
                      </button>
                    ))}
                  </div>
                </>
              )}
              <p className="mt-4 text-xs text-muted">
                For a single place, such as Saturn, choose it in Where they
                went&rsquo;s list of places.
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          {chip(
            "agency",
            "Agency",
            summary(filters.agencies),
            filters.agencies.length > 0,
          )}
          {open === "agency" && (
            <div className={panelClasses}>
              <p className="label-caps text-muted">Agency</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {agencies.map(({ key, title, total }) => (
                  <button
                    key={key}
                    type="button"
                    title={title}
                    aria-pressed={filters.agencies.includes(key)}
                    onClick={() =>
                      onChange({
                        ...filters,
                        agencies: toggled(filters.agencies, key),
                      })
                    }
                    className={pillClasses(filters.agencies.includes(key))}
                  >
                    {key} <span className="text-muted">{total}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          {chip(
            "years",
            "Years",
            filters.years ? `${from}–${to}` : "All",
            filters.years !== null,
          )}
          {open === "years" && (
            <div className={panelClasses}>
              <div className="flex items-baseline justify-between">
                <p className="label-caps text-muted">Launch years</p>
                <p className="font-mono text-sm tabular-nums">
                  {from}–{to}
                </p>
              </div>
              <div className="relative mt-4 h-5">
                <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border-strong" />
                <span
                  className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent"
                  style={{
                    left: `${((from - first) / (last - first)) * 100}%`,
                    right: `${((last - to) / (last - first)) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  aria-label="From"
                  min={first}
                  max={last}
                  value={from}
                  onChange={(event) =>
                    setYears([Math.min(Number(event.target.value), to), to])
                  }
                  className="year-range"
                />
                <input
                  type="range"
                  aria-label="To"
                  min={first}
                  max={last}
                  value={to}
                  onChange={(event) =>
                    setYears([from, Math.max(Number(event.target.value), from)])
                  }
                  className="year-range"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {[
                  { label: "All years", years: null },
                  { label: "Space Race", years: [first, 1975] as [number, number] },
                  { label: "1976–1999", years: [1976, 1999] as [number, number] },
                  { label: "Since 2000", years: [2000, last] as [number, number] },
                  {
                    label: "Last 10 years",
                    years: [last - 9, last] as [number, number],
                  },
                ].map((pick) => {
                  const on =
                    pick.years === null
                      ? filters.years === null
                      : from === pick.years[0] && to === pick.years[1];

                  return (
                    <button
                      key={pick.label}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setYears(pick.years)}
                      className={pillClasses(on)}
                    >
                      {pick.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs sm:ml-auto sm:text-sm">
          <span className="text-muted tabular-nums">
            {shown === missions.length
              ? `${shown} missions`
              : `${shown} of ${missions.length} missions`}
          </span>
          {hasFilters(filters) && (
            <button
              type="button"
              onClick={() => onChange(NO_FILTERS)}
              className="font-medium text-accent hover:underline"
            >
              Reset
            </button>
          )}
          {archive && (
            <Link
              href={archive}
              className="font-medium text-accent hover:underline"
            >
              In the archive →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
