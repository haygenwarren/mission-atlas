import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  agencyList,
  destinationList,
  disciplineLabels,
  formatDate,
  missionLinks,
  statusLabels,
} from "@/lib/missions";
import type { Prisma } from "@/generated/prisma/client";
import type { Status } from "@/generated/prisma/enums";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    agency?: string;
  }>;
};

const statuses = Object.keys(statusLabels) as Status[];

function parseStatus(value?: string) {
  return statuses.find((status) => status.toLowerCase() === value);
}

function getStatusBadgeClasses(status: Status) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "COMPLETED":
      return "bg-gray-200 text-gray-700";
    case "FAILED":
      return "bg-red-100 text-red-700";
  }
}

export default async function MissionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = parseStatus(params.status);

  const where: Prisma.MissionWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (params.agency) {
    where.agencies = { some: { abbreviation: params.agency } };
  }

  const [missions, agencies] = await Promise.all([
    prisma.mission.findMany({
      where,
      orderBy: {
        launchDate: "desc",
      },
      include: missionLinks,
    }),
    prisma.agency.findMany({
      orderBy: {
        abbreviation: "asc",
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold mb-2">Mission Archive</h1>
      <p className="text-sm text-gray-600 mb-6">
        {missions.length} mission{missions.length === 1 ? "" : "s"} found
      </p>

      <form method="GET" className="mb-8 flex flex-wrap gap-4 items-center">
        <select
          name="status"
          defaultValue={status?.toLowerCase() ?? ""}
          className="border rounded px-3 py-2"
        >
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status.toLowerCase()}>
              {statusLabels[status]}
            </option>
          ))}
        </select>

        <select
          name="agency"
          defaultValue={params.agency || ""}
          className="border rounded px-3 py-2"
        >
          <option value="">All agencies</option>
          {agencies.map((agency) => (
            <option key={agency.id} value={agency.abbreviation}>
              {agency.abbreviation}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          Apply Filters
        </button>

        <Link
          href="/missions"
          className="text-sm text-gray-600 hover:text-black"
        >
          Reset
        </Link>
      </form>

      {missions.length === 0 ? (
        <div className="border rounded-xl p-8 text-center text-gray-600">
          <p className="text-lg font-medium mb-2">No missions found</p>
          <p className="text-sm mb-4">
            Try changing or clearing your filters.
          </p>
          <Link
            href="/missions"
            className="inline-block rounded-lg border px-4 py-2 hover:bg-gray-50 transition"
          >
            View all missions
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => (
            <Link
              key={mission.id}
              href={`/missions/${mission.slug}`}
              className="block border rounded-xl p-5 hover:bg-gray-50 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{mission.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {agencyList(mission)} · {destinationList(mission)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                    mission.status
                  )}`}
                >
                  {statusLabels[mission.status]}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-700">{mission.description}</p>

              <div className="mt-4 text-sm text-gray-500">
                <span className="mr-4">
                  <strong>Field:</strong> {disciplineLabels[mission.discipline]}
                </span>
                <span>
                  <strong>Launch:</strong> {formatDate(mission.launchDate)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}