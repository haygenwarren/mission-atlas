import Link from "next/link";
import FeaturedMissions from "@/components/featured-missions";
import MapPreview from "@/components/map/map-preview";
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

const buttonClasses =
  "rounded-lg bg-button px-5 py-2 font-medium text-button-text transition-opacity hover:opacity-90";

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
      {/* The map fills the left of the screen; the words line up with the
          page's content on the right. */}
      <section className="border-b border-border lg:grid lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="h-[26rem] sm:h-[32rem] lg:h-[min(80vh,46rem)] lg:min-h-[32rem] lg:border-r lg:border-border">
          <MapPreview craft={map.craft} names={map.names} />
        </div>

        <div className="flex flex-col justify-center px-6 py-10 lg:w-[calc(26rem+max(1.5rem,(100vw-64rem)/2+1.5rem))] lg:py-12 lg:pl-12 lg:pr-[max(1.5rem,calc((100vw-64rem)/2+1.5rem))]">
          <p className="label-caps mb-3 text-muted">Mission Atlas</p>

          <h1 className="font-display mb-4 text-4xl sm:text-5xl">
            Explore how we explore.
          </h1>

          <p className="text-lg text-foreground/80">
            Where the spacecraft exploring the solar system, and the
            telescopes looking beyond it, are right now, and the story of
            each: {missionCount} missions from space agencies around the
            world.
          </p>

          <Link href="/map" className={`${buttonClasses} mt-6 self-start`}>
            Explore the full map →
          </Link>

          <form action="/missions" method="GET" className="mt-8 flex gap-3">
            <input
              type="search"
              name="q"
              placeholder="Search missions and spacecraft"
              aria-label="Search the archive"
              className="field w-full"
            />
            <button
              type="submit"
              className="rounded-lg border border-border-strong px-4 py-2 font-medium transition-colors hover:border-accent"
            >
              Search
            </button>
          </form>

          <Link
            href="/missions"
            className="mt-4 self-start text-sm font-medium text-accent hover:underline"
          >
            Or browse all {missionCount} missions
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-16 px-6 py-12">
        <section>
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4">
            <h2 className="text-2xl font-semibold">Mission of the Day</h2>
            <p className="text-sm text-muted">{dayFormat.format(today)}</p>
          </div>

          <MissionOfTheDay mission={featured} />
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
