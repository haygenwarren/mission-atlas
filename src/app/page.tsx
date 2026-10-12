import Link from "next/link";
import FeaturedMissions from "@/components/featured-missions";
import { prisma } from "@/lib/prisma";
import { missionTileSelect } from "@/lib/missions";
import { sample } from "@/lib/random";

export const revalidate = 3600;

// How many missions each hourly rebuild hands the browser to pick from.
const FEATURED_POOL_SIZE = 24;

export default async function Home() {
  const [missionCount, activeCount, agencyCount, destinationCount, ids] =
    await Promise.all([
      prisma.mission.count(),
      prisma.mission.count({ where: { status: "ACTIVE" } }),
      prisma.agency.count(),
      prisma.destination.count(),
      prisma.mission.findMany({ select: { id: true } }),
    ]);

  const featuredPool = await prisma.mission.findMany({
    where: {
      id: { in: sample(ids, FEATURED_POOL_SIZE).map(({ id }) => id) },
    },
    select: missionTileSelect,
  });

  const stats = [
    { label: "Missions", value: missionCount },
    { label: "Active now", value: activeCount },
    { label: "Agencies", value: agencyCount },
    { label: "Destinations", value: destinationCount },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="mb-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
          Mission Atlas
        </p>

        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          Explore the history and current state of space missions.
        </h1>

        <p className="max-w-3xl text-lg text-gray-600">
          Mission Atlas is an archive of planetary science and astrophysics
          missions from space agencies around the world. Search the archive,
          or open a mission to see its spacecraft, dates and destinations.
        </p>

        <form action="/missions" method="GET" className="mt-8 flex gap-3">
          <input
            type="search"
            name="q"
            placeholder="Search missions, spacecraft, agencies or destinations"
            aria-label="Search the archive"
            className="w-full max-w-xl rounded-lg border px-4 py-3"
          />
          <button
            type="submit"
            className="rounded-lg bg-black px-5 py-3 text-white transition hover:bg-gray-800"
          >
            Search
          </button>
        </form>

        <Link
          href="/missions"
          className="mt-4 inline-block text-sm font-medium hover:underline"
        >
          Or browse all {missionCount} missions
        </Link>
      </section>

      <section className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured Missions</h2>
          <Link href="/missions" className="text-sm font-medium hover:underline">
            View all
          </Link>
        </div>

        <FeaturedMissions pool={featuredPool} />
      </section>
    </main>
  );
}
