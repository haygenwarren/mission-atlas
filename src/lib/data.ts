import type {
  Discipline,
  DestinationKind,
  Status,
} from "@/generated/prisma/enums";

// What the data page's charts are made from, worked out on the server from
// the missions in the database.

// The groups the charts colour missions by. Space telescopes are one group;
// every other mission goes by the first place it went (Cassini's is
// Jupiter, Dawn's is Vesta).
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

// What the page reads about each mission.
export type MissionFacts = {
  slug: string;
  name: string;
  status: Status;
  discipline: Discipline;
  launchDate: Date;
  agencies: { abbreviation: string; name: string }[];
  destinations: { slug: string; name: string; kind: DestinationKind }[];
  spacecraft: { launchMassKg: number | null }[];
};

// A year's missions, for the missions-per-year chart.
export type YearColumn = {
  year: number;
  missions: { slug: string; name: string; group: Group }[];
};

// A bar in a list of bars: a destination or an agency, with its missions
// counted by status.
export type StatusRow = {
  key: string;
  label: string;
  // Said in full when the label is short ("ESA").
  title: string;
  href: string;
  counts: Record<Status, number>;
  total: number;
};

// A mission on the launch mass chart.
export type MassPoint = {
  slug: string;
  name: string;
  group: Group;
  launchDate: string;
  massKg: number;
};

export function groupOf(mission: MissionFacts): Group {
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

const byGroup = (a: { group: Group }, b: { group: Group }) =>
  GROUPS.findIndex(({ key }) => key === a.group) -
  GROUPS.findIndex(({ key }) => key === b.group);

// Every year from the first launch to the last, with the missions launched
// in it (none, for a quiet year), each year's ordered by group.
export function missionsByYear(missions: MissionFacts[]): YearColumn[] {
  const years = missions.map(({ launchDate }) => launchDate.getUTCFullYear());
  const first = Math.min(...years);
  const last = Math.max(...years);

  return Array.from({ length: last - first + 1 }, (_, i) => ({
    year: first + i,
    missions: missions
      .filter(({ launchDate }) => launchDate.getUTCFullYear() === first + i)
      .map((mission) => ({
        slug: mission.slug,
        name: mission.name,
        group: groupOf(mission),
      }))
      .sort(byGroup),
  }));
}

function emptyCounts(): Record<Status, number> {
  return { ACTIVE: 0, COMPLETED: 0, FAILED: 0 };
}

// Rows counted from each mission's list of places or agencies: a mission
// listing several counts once for each. Most first.
function countRows(
  missions: MissionFacts[],
  listOf: (mission: MissionFacts) => Omit<StatusRow, "counts" | "total">[],
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

  return [...rows.values()].sort(
    (a, b) => b.total - a.total || a.label.localeCompare(b.label),
  );
}

export function missionsByDestination(missions: MissionFacts[]) {
  return countRows(missions, (mission) =>
    mission.destinations.map(({ slug, name }) => ({
      key: slug,
      label: name,
      title: name,
      href: `/missions?destination=${slug}`,
    })),
  );
}

export function missionsByAgency(missions: MissionFacts[]) {
  return countRows(missions, (mission) =>
    mission.agencies.map(({ abbreviation, name }) => ({
      key: abbreviation,
      label: abbreviation,
      title: name,
      href: `/missions?agency=${encodeURIComponent(abbreviation)}`,
    })),
  );
}

// Each mission's launch mass: the masses of its craft added up, since a
// carried craft (Huygens aboard Cassini) is catalogued on its own. Missions
// with no recorded mass are left out.
export function launchMasses(missions: MissionFacts[]): MassPoint[] {
  return missions.flatMap((mission) => {
    const masses = mission.spacecraft
      .map(({ launchMassKg }) => launchMassKg)
      .filter((mass) => mass !== null);

    return masses.length === 0
      ? []
      : [
          {
            slug: mission.slug,
            name: mission.name,
            group: groupOf(mission),
            launchDate: mission.launchDate.toISOString(),
            massKg: masses.reduce((sum, mass) => sum + mass, 0),
          },
        ];
  });
}
