import Link from "next/link";
import FeaturedMissions from "@/components/featured-missions";
import HomeHero from "@/components/home-hero";
import MissionOfTheDay from "@/components/mission-of-the-day";
import { getMapData } from "@/lib/map-data";
import {
  missionLinks,
  missionOfTheDay,
  missionTileSelect,
} from "@/lib/missions";
import { prisma } from "@/lib/prisma";
import { sample } from "@/lib/random";

export const revalidate = 3600;

// How many missions each hourly rebuild hands the browser to pick from.
const FEATURED_POOL_SIZE = 24;

const REPOSITORY = "https://github.com/haygenwarren/mission-atlas";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeZone: "UTC",
});

export default async function Home() {
  const today = new Date();
  const [
    missionCount,
    activeCount,
    agencyCount,
    destinationCount,
    pictured,
    map,
  ] = await Promise.all([
    prisma.mission.count(),
    prisma.mission.count({ where: { status: "ACTIVE" } }),
    prisma.agency.count(),
    prisma.destination.count(),
    prisma.mission.findMany({
      where: { imageUrl: { not: null } },
      select: { id: true, slug: true },
    }),
    getMapData(),
  ]);

  // Only missions with a picture take a turn as Mission of the Day.
  const pick = missionOfTheDay(pictured, today);
  const [featured, featuredPool] = await Promise.all([
    prisma.mission.findUniqueOrThrow({
      where: { id: pick.id },
      include: missionLinks,
    }),
    prisma.mission.findMany({
      where: {
        id: {
          in: sample(
            pictured.filter(({ id }) => id !== pick.id),
            FEATURED_POOL_SIZE,
          ).map(({ id }) => id),
        },
      },
      select: missionTileSelect,
    }),
  ]);

  const stats = [
    { label: "Missions", value: missionCount },
    { label: "Active now", value: activeCount },
    { label: "Agencies", value: agencyCount },
    { label: "Destinations", value: destinationCount },
  ];

  return (
    <main>
      <HomeHero
        craft={map.craft}
        names={map.names}
        missionCount={missionCount}
      />

      <div className="mx-auto max-w-5xl space-y-16 px-6 py-12">
        <section>
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4">
            <h2 className="text-2xl font-semibold">Mission of the Day</h2>
            <p className="text-sm text-muted">{dayFormat.format(today)}</p>
          </div>

          <MissionOfTheDay mission={featured} />
        </section>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
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

        <section id="about" className="max-w-3xl">
          <h2 className="text-2xl font-semibold">About</h2>

          <div className="mt-4 space-y-4 leading-relaxed text-foreground/90">
            <p>
              Mission Atlas follows the robotic missions sent to explore the
              solar system and to look out beyond it: where each spacecraft is
              right now, and how it got there. It covers {missionCount}{" "}
              missions from {agencyCount} space agencies, from Luna 2 in 1959
              to missions still on their way.
            </p>
            <p>
              Launch times and spacecraft details come from Jonathan
              McDowell&apos;s General Catalog of Artificial Space Objects.
              Positions come from NASA JPL&apos;s Horizons system and are
              refreshed every day. Pictures come from Wikimedia Commons.
              Mission details are checked against the agencies&apos; own pages
              and NASA&apos;s space science data archive.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <a href={REPOSITORY} className="text-accent hover:underline">
              The code on GitHub →
            </a>
            <a
              href={`${REPOSITORY}/issues`}
              className="text-accent hover:underline"
            >
              Spotted a mistake? Tell us on GitHub →
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
