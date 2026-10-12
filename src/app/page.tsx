import Image from "next/image";
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
        <div className="flex items-center gap-10">
          <div>
            <p className="label-caps mb-3 text-muted">Mission Atlas</p>

            <h1 className="font-display mb-4 text-4xl sm:text-5xl">
              Explore the history and current state of space missions.
            </h1>

            <p className="max-w-3xl text-lg text-foreground/80">
              Mission Atlas is an archive of planetary science and astrophysics
              missions from space agencies around the world. Search the
              archive, or open a mission to see its spacecraft, dates and
              destinations.
            </p>
          </div>

          <Image
            src="/brand/mission-atlas-emblem.svg"
            alt=""
            width={192}
            height={192}
            unoptimized
            priority
            className="hidden shrink-0 md:block"
          />
        </div>

        <form action="/missions" method="GET" className="mt-8 flex gap-3">
          <input
            type="search"
            name="q"
            placeholder="Search missions, spacecraft, agencies or destinations"
            aria-label="Search the archive"
            className="field w-full max-w-xl"
          />
          <button
            type="submit"
            className="rounded-lg bg-button px-5 py-2 font-medium text-button-text transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </form>

        <Link
          href="/missions"
          className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
        >
          Or browse all {missionCount} missions
        </Link>
      </section>

      <section className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <p className="label-caps text-muted">{label}</p>
            <p className="font-display mt-2 text-3xl">{value}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured Missions</h2>
          <Link
            href="/missions"
            className="text-sm font-medium text-accent hover:underline"
          >
            View all
          </Link>
        </div>

        <FeaturedMissions pool={featuredPool} />
      </section>
    </main>
  );
}
