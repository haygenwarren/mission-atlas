import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const missionCount = await prisma.mission.count();

  const featuredMissions = await prisma.mission.findMany({
    take: 3,
    orderBy: {
      launchDate: "desc",
    },
  });

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
          Mission Atlas is a full-stack mission tracking platform for planetary
          science and astrophysics. Browse a growing archive of missions, open
          detailed mission pages, and build toward live mission status and data
          tools.
        </p>

        <div className="mt-8 flex gap-4">
          <Link
            href="/missions"
            className="rounded-lg bg-black px-5 py-3 text-white transition hover:bg-gray-800"
          >
            Browse Mission Archive
          </Link>

          <Link
            href="/missions"
            className="rounded-lg border px-5 py-3 transition hover:bg-gray-50"
          >
            View Missions
          </Link>
        </div>
      </section>

      <section className="mb-12 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">Missions in database</p>
          <p className="mt-2 text-3xl font-bold">{missionCount}</p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">Project status</p>
          <p className="mt-2 text-3xl font-bold">MVP</p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">Database</p>
          <p className="mt-2 text-3xl font-bold">Neon + Prisma</p>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured Missions</h2>
          <Link href="/missions" className="text-sm font-medium hover:underline">
            View all
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featuredMissions.map((mission) => (
            <Link
              key={mission.id}
              href={`/missions/${mission.slug}`}
              className="rounded-xl border p-5 transition hover:bg-gray-50"
            >
              <p className="text-sm text-gray-500">{mission.agency}</p>
              <h3 className="mt-2 text-xl font-semibold">{mission.name}</h3>
              <p className="mt-2 text-sm text-gray-600">
                {mission.status} · {mission.target}
              </p>
              <p className="mt-4 text-sm">{mission.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}