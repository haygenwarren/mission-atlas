import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    agency?: string;
  }>;
};

function getStatusBadgeClasses(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-700";
    case "completed":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default async function MissionsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const where: {
    status?: string;
    agency?: string;
  } = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.agency) {
    where.agency = params.agency;
  }

  const missions = await prisma.mission.findMany({
    where,
    orderBy: {
      launchDate: "desc",
    },
  });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold mb-2">Mission Archive</h1>
      <p className="text-sm text-gray-600 mb-6">
        {missions.length} mission{missions.length === 1 ? "" : "s"} found
      </p>

      <form method="GET" className="mb-8 flex flex-wrap gap-4 items-center">
        <select
          name="status"
          defaultValue={params.status || ""}
          className="border rounded px-3 py-2"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>

        <select
          name="agency"
          defaultValue={params.agency || ""}
          className="border rounded px-3 py-2"
        >
          <option value="">All agencies</option>
          <option value="NASA">NASA</option>
          <option value="NASA/ESA/CSA">NASA/ESA/CSA</option>
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
                    {mission.agency} · {mission.target}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                    mission.status
                  )}`}
                >
                  {mission.status}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-700">{mission.description}</p>

              <div className="mt-4 text-sm text-gray-500">
                <span className="mr-4">
                  <strong>Type:</strong> {mission.missionType}
                </span>
                <span>
                  <strong>Launch:</strong>{" "}
                  {mission.launchDate
                    ? new Date(mission.launchDate).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}