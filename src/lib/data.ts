import type {
  Discipline,
  DestinationKind,
  Status,
} from "@/generated/prisma/enums";

// What the data page's dashboard is made from: each mission's facts, the
// filters, and the numbers each card shows. The server gathers the facts;
// the browser filters them and works out the rest as the filters change.

// The groups the charts colour missions by, and the "where it went" filter
// picks from. Space telescopes are one group; every other mission goes by
// the first place it went (Cassini's is Jupiter, Dawn's is Vesta).
export const GROUPS = [
  { key: "moon", label: "The Moon" },
  { key: "inner", label: "Mercury and Venus" },
  { key: "mars", label: "Mars" },
  { key: "outer", label: "Jupiter and beyond" },
  { key: "small", label: "Asteroids and comets" },
  { key: "telescopes", label: "Space telescopes" },
] as const;

export type Group = (typeof GROUPS)[number]["key"];

// Statuses in the order the charts stack them.
export const STATUSES: Status[] = ["ACTIVE", "COMPLETED", "FAILED"];

// The agencies the charts colour on their own when colouring by agency. A
// mission run by several is coloured by the first it lists.
export const AGENCY_GROUPS = [
  { key: "nasa", label: "NASA", agencies: ["NASA"] },
  { key: "esa", label: "ESA", agencies: ["ESA"] },
  { key: "russia", label: "USSR and Russia", agencies: ["USSR", "Roscosmos"] },
  { key: "jaxa", label: "JAXA", agencies: ["JAXA"] },
  { key: "cnsa", label: "CNSA", agencies: ["CNSA"] },
  { key: "isro", label: "ISRO", agencies: ["ISRO"] },
  { key: "others", label: "Others", agencies: [] },
] as const;

// What the page knows about each mission, sent to the browser.
export type MissionFacts = {
  slug: string;
  name: string;
  status: Status;
  group: Group;
  launchDate: string;
  launchYear: number;
  // Days from launch to its last contact (or declared end), or to now
  // while it is active; null when its end is not known.
  days: number | null;
  agencies: { abbreviation: string; name: string }[];
  destinations: { slug: string; name: string; kind: DestinationKind }[];
  // Its craft's launch masses added up, since a carried craft (Huygens
  // aboard Cassini) is catalogued on its own; null if none is recorded.
  massKg: number | null;
};

// A mission as the database has it, for `missionFacts`.
type MissionRow = {
  slug: string;
  name: string;
  status: Status;
  discipline: Discipline;
  launchDate: Date;
  lastContact: Date | null;
  endDeclared: Date | null;
  agencies: { abbreviation: string; name: string }[];
  destinations: { slug: string; name: string; kind: DestinationKind }[];
  spacecraft: { launchMassKg: number | null }[];
};

export function groupOf(mission: {
  discipline: Discipline;
  destinations: { slug: string; kind: DestinationKind }[];
}): Group {
  if (mission.discipline === "ASTROPHYSICS") return "telescopes";

  const first = mission.destinations[0];

  if (!first || first.kind === "ORBIT") return "telescopes";
  if (first.slug === "moon") return "moon";
  if (first.slug === "mercury" || first.slug === "venus") return "inner";
  if (first.slug === "mars") return "mars";
  if (
    first.kind === "ASTEROID" ||
    first.kind === "COMET" ||
    first.slug === "ceres"
  ) {
    return "small";
  }

  return "outer";
}

export function missionFacts(row: MissionRow, now: Date): MissionFacts {
  const end =
    row.lastContact ??
    row.endDeclared ??
    (row.status === "ACTIVE" ? now : null);
  const masses = row.spacecraft
    .map(({ launchMassKg }) => launchMassKg)
    .filter((mass) => mass !== null);

  return {
    slug: row.slug,
    name: row.name,
    status: row.status,
    group: groupOf(row),
    launchDate: row.launchDate.toISOString(),
    launchYear: row.launchDate.getUTCFullYear(),
    days: end && (end.getTime() - row.launchDate.getTime()) / 86_400_000,
    agencies: row.agencies,
    destinations: row.destinations,
    massKg:
      masses.length > 0 ? masses.reduce((sum, mass) => sum + mass, 0) : null,
  };
}

export function agencyGroupOf(mission: MissionFacts) {
  const first = mission.agencies[0]?.abbreviation;

  return (
    AGENCY_GROUPS.find(({ agencies }) =>
      (agencies as readonly string[]).includes(first),
    )?.key ?? "others"
  );
}

// The filters, as the address keeps them, for example
// "?status=active&where=mars,moon&agency=NASA&years=2000-2026". Empty means
// no filter on that.
export type Filters = {
  status: Status | null;
  // Groups, and single places picked from the chart of places.
  where: Group[];
  places: string[];
  agencies: string[];
  years: [from: number, to: number] | null;
};

export const NO_FILTERS: Filters = {
  status: null,
  where: [],
  places: [],
  agencies: [],
  years: null,
};

// The parts of the filters a chart can leave out: a chart of agencies shows
// every agency the other filters allow, with the chosen ones picked out.
export type Dimension = "status" | "where" | "agency" | "years";

const list = (value: string | null) =>
  value ? value.split(",").filter(Boolean) : [];

export function readFilters(params: URLSearchParams): Filters {
  const status = params.get("status")?.toUpperCase();
  const years = params.get("years")?.match(/^(\d{4})-(\d{4})$/);
  const groups = GROUPS.map(({ key }) => key as string);

  return {
    status: STATUSES.includes(status as Status) ? (status as Status) : null,
    where: list(params.get("where")).filter((key) =>
      groups.includes(key),
    ) as Group[],
    places: list(params.get("place")),
    agencies: list(params.get("agency")),
    years: years ? [Number(years[1]), Number(years[2])] : null,
  };
}

export function filterQuery(filters: Filters) {
  const query = new URLSearchParams();

  if (filters.status) query.set("status", filters.status.toLowerCase());
  if (filters.where.length) query.set("where", filters.where.join(","));
  if (filters.places.length) query.set("place", filters.places.join(","));
  if (filters.agencies.length) query.set("agency", filters.agencies.join(","));
  if (filters.years) query.set("years", filters.years.join("-"));

  // Commas read better in an address than %2C.
  return query.toString().replaceAll("%2C", ",");
}

export function hasFilters(filters: Filters) {
  return filterQuery(filters) !== "";
}

// The missions the filters let through, ignoring the dimensions in
// `except`. Within a filter any choice will do (Mars or the Moon); across
// filters every one must match.
export function filterMissions(
  missions: MissionFacts[],
  filters: Filters,
  except: Dimension[] = [],
) {
  const uses = (dimension: Dimension) => !except.includes(dimension);

  return missions.filter(
    (mission) =>
      (!uses("status") ||
        !filters.status ||
        mission.status === filters.status) &&
      (!uses("where") ||
        (filters.where.length === 0 && filters.places.length === 0) ||
        filters.where.includes(mission.group) ||
        mission.destinations.some(({ slug }) =>
          filters.places.includes(slug),
        )) &&
      (!uses("agency") ||
        filters.agencies.length === 0 ||
        mission.agencies.some(({ abbreviation }) =>
          filters.agencies.includes(abbreviation),
        )) &&
      (!uses("years") ||
        !filters.years ||
        (mission.launchYear >= filters.years[0] &&
          mission.launchYear <= filters.years[1])),
  );
}

// The archive's address for the same missions, when its filters (one of
// each, and a single year) can say the same thing; otherwise null.
export function archiveHref(filters: Filters) {
  if (
    filters.where.length > 0 ||
    filters.places.length > 1 ||
    filters.agencies.length > 1 ||
    (filters.years && filters.years[0] !== filters.years[1])
  ) {
    return null;
  }

  const query = new URLSearchParams();

  if (filters.status) query.set("status", filters.status.toLowerCase());
  if (filters.agencies[0]) query.set("agency", filters.agencies[0]);
  if (filters.places[0]) query.set("destination", filters.places[0]);
  if (filters.years) query.set("year", String(filters.years[0]));

  const string = query.toString();

  return string ? `/missions?${string}` : "/missions";
}

// The headline numbers.
export function headline(missions: MissionFacts[]) {
  return {
    missions: missions.length,
    active: missions.filter(({ status }) => status === "ACTIVE").length,
    agencies: new Set(
      missions.flatMap(({ agencies }) =>
        agencies.map(({ abbreviation }) => abbreviation),
      ),
    ).size,
    // Every mission's time in space added up.
    years:
      missions.reduce((sum, { days }) => sum + Math.max(0, days ?? 0), 0) /
      365.25,
  };
}

// A year's missions, for the missions-per-year chart.
export type YearColumn = { year: number; missions: MissionFacts[] };

// Every year from `first` to `last`, with the missions launched in it.
export function missionsByYear(
  missions: MissionFacts[],
  first: number,
  last: number,
): YearColumn[] {
  return Array.from({ length: last - first + 1 }, (_, i) => ({
    year: first + i,
    missions: missions.filter(({ launchYear }) => launchYear === first + i),
  }));
}

// A bar in a list of bars: a group, place or agency, with its missions
// counted by status.
export type StatusRow = {
  key: string;
  label: string;
  // Said in full when the label is short ("ESA").
  title: string;
  counts: Record<Status, number>;
  total: number;
};

function emptyCounts(): Record<Status, number> {
  return { ACTIVE: 0, COMPLETED: 0, FAILED: 0 };
}

// Rows counted from each mission's list of places or agencies: a mission
// listing several counts once for each. Most first, or in `order`.
function countRows(
  missions: MissionFacts[],
  listOf: (mission: MissionFacts) => Omit<StatusRow, "counts" | "total">[],
  order?: string[],
) {
  const rows = new Map<string, StatusRow>();

  for (const mission of missions) {
    for (const item of listOf(mission)) {
      const row = rows.get(item.key) ?? {
        ...item,
        counts: emptyCounts(),
        total: 0,
      };

      row.counts[mission.status]++;
      row.total++;
      rows.set(item.key, row);
    }
  }

  return [...rows.values()].sort((a, b) =>
    order
      ? order.indexOf(a.key) - order.indexOf(b.key)
      : b.total - a.total || a.label.localeCompare(b.label),
  );
}

export function missionsByGroup(missions: MissionFacts[]) {
  return countRows(
    missions,
    (mission) => {
      const { key, label } = GROUPS.find(({ key }) => key === mission.group)!;

      return [{ key, label, title: label }];
    },
    GROUPS.map(({ key }) => key),
  );
}

export function missionsByPlace(missions: MissionFacts[]) {
  return countRows(missions, (mission) =>
    mission.destinations.map(({ slug, name }) => ({
      key: slug,
      label: name,
      title: name,
    })),
  );
}

export function missionsByAgency(missions: MissionFacts[]) {
  return countRows(missions, (mission) =>
    mission.agencies.map(({ abbreviation, name }) => ({
      key: abbreviation,
      label: abbreviation,
      title: name,
    })),
  );
}

// The decades from the first launch's to the last's.
export function decadesOf(missions: MissionFacts[]) {
  const years = missions.map(({ launchYear }) => launchYear);
  const first = Math.floor(Math.min(...years) / 10) * 10;
  const last = Math.floor(Math.max(...years) / 10) * 10;

  return Array.from(
    { length: (last - first) / 10 + 1 },
    (_, i) => first + i * 10,
  );
}
