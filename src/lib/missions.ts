import type { Prisma } from "@/generated/prisma/client";
import type {
  DestinationKind,
  Discipline,
  PowerSource,
  SpacecraftKind,
  Status,
} from "@/generated/prisma/enums";

export const statusLabels: Record<Status, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export const disciplineLabels: Record<Discipline, string> = {
  PLANETARY_SCIENCE: "Planetary science",
  ASTROPHYSICS: "Astrophysics",
};

export const spacecraftKindLabels: Record<SpacecraftKind, string> = {
  FLYBY: "Flyby",
  ORBITER: "Orbiter",
  LANDER: "Lander",
  ROVER: "Rover",
  ATMOSPHERIC_PROBE: "Atmospheric probe",
  IMPACTOR: "Impactor",
  ROTORCRAFT: "Rotorcraft",
  TELESCOPE: "Telescope",
};

export const powerSourceLabels: Record<PowerSource, string> = {
  SOLAR: "Solar",
  RADIOISOTOPE: "Radioisotope",
  BATTERY: "Battery",
};

// Group headings for the destination filter, in display order.
export const destinationKindLabels: Record<DestinationKind, string> = {
  PLANET: "Planets",
  MOON: "Moons",
  DWARF_PLANET: "Dwarf planets",
  ASTEROID: "Asteroids and small bodies",
  COMET: "Comets",
  ORBIT: "Orbits",
  INTERSTELLAR_SPACE: "Beyond the Solar System",
};

// Ordered by id so a mission's agencies and destinations always list in the
// same order.
export const missionLinks = {
  agencies: { orderBy: { id: "asc" } },
  destinations: { orderBy: { id: "asc" } },
} satisfies Prisma.MissionInclude;

// The fields a mission tile shows, and nothing else, so lists stay light.
export const missionTileSelect = {
  id: true,
  slug: true,
  name: true,
  status: true,
  launchDate: true,
  description: true,
  imageUrl: true,
  agencies: { select: { abbreviation: true }, orderBy: { id: "asc" } },
  destinations: { select: { name: true }, orderBy: { id: "asc" } },
} satisfies Prisma.MissionSelect;

export type MissionTileData = Prisma.MissionGetPayload<{
  select: typeof missionTileSelect;
}>;

export function agencyList(mission: { agencies: { abbreviation: string }[] }) {
  return mission.agencies.map((agency) => agency.abbreviation).join("/");
}

export function destinationList(mission: {
  destinations: { name: string }[];
}) {
  return mission.destinations.map((destination) => destination.name).join(", ");
}

function formatNumber(value: number) {
  return value.toLocaleString("en-GB", { maximumFractionDigits: 1 });
}

export function formatMass(kilograms: number) {
  return `${formatNumber(kilograms)} kg`;
}

// Body length and diameter, then the span with antennas and arrays deployed.
export function formatSize(craft: {
  lengthM: number | null;
  diameterM: number | null;
  spanM: number | null;
}) {
  const metres = (value: number) => `${formatNumber(value)} m`;
  const { lengthM, diameterM, spanM } = craft;
  const parts = [];

  if (lengthM !== null && diameterM !== null) {
    parts.push(`${metres(lengthM)} × ${metres(diameterM)}`);
  } else if (lengthM !== null) {
    parts.push(`length ${metres(lengthM)}`);
  } else if (diameterM !== null) {
    parts.push(`diameter ${metres(diameterM)}`);
  }

  if (spanM !== null) {
    parts.push(`span ${metres(spanM)}`);
  }

  return parts.join(", ");
}

export function formatDate(
  date: Date,
  time: "none" | "minutes" | "seconds" = "minutes",
) {
  const formatted = date.toLocaleString("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle:
      time === "none" ? undefined : time === "seconds" ? "medium" : "short",
  });

  return time === "none" ? formatted : `${formatted} UTC`;
}

export function formatTime(date: Date) {
  return `${date.toLocaleTimeString("en-GB", { timeZone: "UTC" })} UTC`;
}

function plural(count: number, unit: string) {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

// The calendar gap between two UTC dates in its two largest units, such as
// "19 years 11 months" or "3 months 28 days".
export function formatDuration(from: Date, to: Date) {
  let years = to.getUTCFullYear() - from.getUTCFullYear();
  let months = to.getUTCMonth() - from.getUTCMonth();
  let days = to.getUTCDate() - from.getUTCDate();

  if (days < 0) {
    months -= 1;
    // Day 0 of a month is the last day of the month before it.
    days += new Date(
      Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 0),
    ).getUTCDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0) {
    return months > 0
      ? `${plural(years, "year")} ${plural(months, "month")}`
      : plural(years, "year");
  }

  if (months > 0) {
    return days > 0
      ? `${plural(months, "month")} ${plural(days, "day")}`
      : plural(months, "month");
  }

  return days > 0 ? plural(days, "day") : "Less than a day";
}

// How long a mission ran: from launch to its last contact (or, failing that,
// the day its end was declared), or to now while it is still active.
export function missionDuration(mission: {
  status: Status;
  launchDate: Date;
  lastContact: Date | null;
  endDeclared: Date | null;
}) {
  const end =
    mission.lastContact ??
    mission.endDeclared ??
    (mission.status === "ACTIVE" ? new Date() : null);

  return end && formatDuration(mission.launchDate, end);
}
