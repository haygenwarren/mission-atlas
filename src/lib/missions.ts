import type { Prisma } from "@/generated/prisma/client";
import type { Discipline, Status } from "@/generated/prisma/enums";

export const statusLabels: Record<Status, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export const disciplineLabels: Record<Discipline, string> = {
  PLANETARY_SCIENCE: "Planetary science",
  ASTROPHYSICS: "Astrophysics",
};

// Ordered by id so a mission's agencies and destinations always list in the
// same order.
export const missionLinks = {
  agencies: { orderBy: { id: "asc" } },
  destinations: { orderBy: { id: "asc" } },
} satisfies Prisma.MissionInclude;

type MissionWithLinks = Prisma.MissionGetPayload<{
  include: typeof missionLinks;
}>;

export function agencyList(mission: Pick<MissionWithLinks, "agencies">) {
  return mission.agencies.map((agency) => agency.abbreviation).join("/");
}

export function destinationList(
  mission: Pick<MissionWithLinks, "destinations">,
) {
  return mission.destinations.map((destination) => destination.name).join(", ");
}

export function formatDate(date: Date, withTime = true) {
  const formatted = date.toLocaleString("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: withTime ? "short" : undefined,
  });

  return withTime ? `${formatted} UTC` : formatted;
}
