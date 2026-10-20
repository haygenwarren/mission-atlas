"use client";

import type { Ref } from "react";
import type { Status } from "@/generated/prisma/enums";

// Where a mission's craft are now, as the list filters them.
export type Where = "flight" | "body" | "earth" | "unknown";

const WHERE_LABELS: Record<Where, string> = {
  flight: "In flight",
  body: "At a planet or body",
  earth: "Earth orbit & Moon",
  unknown: "Position unknown",
};

export type Filters = {
  query: string;
  // Within each group any ticked option matches; nothing ticked means all.
  status: ("active" | "ended")[];
  where: Where[];
  // An agency's abbreviation, or "" for all.
  agency: string;
};

export const NO_FILTERS: Filters = {
  query: "",
  status: [],
  where: [],
  agency: "",
};

// One row of the list: a mission, with where its craft are now.
export type ListMission = {
  slug: string;
  name: string;
  status: Status;
  agencies: string[];
  where: string;
  places: Where[];
  // Everything search looks through, in plain lower case.
  text: string;
};

export const statusDots: Record<Status, string> = {
  ACTIVE: "bg-status-active",
  COMPLETED: "bg-status-completed",
  FAILED: "bg-status-failed",
};

// Lower case without accents or punctuation, so "change" finds Chang'e,
// "steins" finds Šteins and "churyumov gerasimenko" finds 67P.
export function plain(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’‘`]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

export function matches(mission: ListMission, filters: Filters) {
  const query = plain(filters.query.trim());
  const status = mission.status === "ACTIVE" ? "active" : "ended";

  return (
    (!query || mission.text.includes(query)) &&
    (filters.status.length === 0 || filters.status.includes(status)) &&
    (filters.where.length === 0 ||
      mission.places.some((place) => filters.where.includes(place))) &&
    (!filters.agency || mission.agencies.includes(filters.agency))
  );
}

function toggle<T>(list: T[], item: T) {
  return list.includes(item)
    ? list.filter((other) => other !== item)
    : [...list, item];
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
        pressed
          ? "border-accent bg-accent/15 text-foreground"
          : "border-border-strong text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function MissionList({
  rows,
  total,
  filters,
  onFilters,
  agencies,
  selected,
  onHover,
  onSelect,
  onHide,
  className,
  panelRef,
}: {
  // The missions that match the filters.
  rows: ListMission[];
  total: number;
  filters: Filters;
  onFilters: (filters: Filters) => void;
  agencies: { abbreviation: string; name: string }[];
  selected: string | null;
  onHover: (mission: string | null) => void;
  onSelect: (mission: string) => void;
  onHide: () => void;
  className: string;
  panelRef: Ref<HTMLElement>;
}) {
  const filtered =
    filters.query.trim() !== "" ||
    filters.status.length > 0 ||
    filters.where.length > 0 ||
    filters.agency !== "";

  return (
    <section
      ref={panelRef}
      aria-label="Missions on the map"
      className={`absolute z-10 flex-col rounded-xl border border-border bg-surface/95 shadow-xl backdrop-blur ${className}`}
    >
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="label-caps text-muted">Missions</h2>
          <button
            type="button"
            onClick={onHide}
            aria-label="Hide the mission list"
            className="rounded-lg px-2 text-xl leading-none text-muted hover:text-foreground"
          >
            ×
          </button>
        </div>

        <input
          type="search"
          value={filters.query}
          onChange={(event) =>
            onFilters({ ...filters, query: event.target.value })
          }
          placeholder="Search missions and spacecraft"
          aria-label="Search missions and spacecraft"
          className="field mt-3 w-full text-sm"
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(["active", "ended"] as const).map((status) => (
            <Chip
              key={status}
              pressed={filters.status.includes(status)}
              onClick={() =>
                onFilters({ ...filters, status: toggle(filters.status, status) })
              }
            >
              {status === "active" ? "Active" : "Ended"}
            </Chip>
          ))}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {(Object.keys(WHERE_LABELS) as Where[]).map((where) => (
            <Chip
              key={where}
              pressed={filters.where.includes(where)}
              onClick={() =>
                onFilters({ ...filters, where: toggle(filters.where, where) })
              }
            >
              {WHERE_LABELS[where]}
            </Chip>
          ))}
        </div>

        <select
          value={filters.agency}
          onChange={(event) =>
            onFilters({ ...filters, agency: event.target.value })
          }
          aria-label="Agency"
          className="field mt-3 w-full text-sm"
        >
          <option value="">All agencies</option>
          {agencies.map((agency) => (
            <option key={agency.abbreviation} value={agency.abbreviation}>
              {agency.abbreviation} · {agency.name}
            </option>
          ))}
        </select>

        <p className="mt-3 text-xs text-muted">
          {filtered ? `${rows.length} of ${total} missions` : `${total} missions`}
          {filtered && (
            <button
              type="button"
              onClick={() => onFilters(NO_FILTERS)}
              className="ml-2 text-accent hover:underline"
            >
              Clear filters
            </button>
          )}
        </p>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {rows.map((row) => (
          <li key={row.slug}>
            <button
              type="button"
              onClick={() => onSelect(row.slug)}
              onMouseEnter={() => onHover(row.slug)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(row.slug)}
              onBlur={() => onHover(null)}
              aria-current={row.slug === selected ? "true" : undefined}
              className="w-full rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-background/60 aria-[current=true]:bg-background"
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`h-2 w-2 shrink-0 rounded-full ${statusDots[row.status]}`}
                />
                <span className="truncate text-sm font-semibold">
                  {row.name}
                </span>
              </span>
              <span className="mt-0.5 block truncate pl-4 text-xs text-muted">
                {row.where}
              </span>
            </button>
          </li>
        ))}

        {rows.length === 0 && (
          <li className="px-2.5 py-2 text-sm text-muted">
            No missions match.
          </li>
        )}
      </ul>
    </section>
  );
}
