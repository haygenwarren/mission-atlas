import Link from "next/link";
import AboutEmblem from "@/components/about-emblem";
import ContactDialog from "@/components/contact-dialog";
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
import { AUTHOR } from "@/lib/site";

export const revalidate = 3600;

// How many missions each hourly rebuild hands the browser to pick from.
const FEATURED_POOL_SIZE = 24;

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeZone: "UTC",
});

const linkClasses = "text-accent underline";

// The archive's first and latest launches, named in the About section.
const launchSelect = { slug: true, name: true, launchDate: true } as const;

function MissionLink({ mission }: { mission: { slug: string; name: string } }) {
  return (
    <Link href={`/missions/${mission.slug}`} className={linkClasses}>
      {mission.name}
    </Link>
  );
}

export default async function Home() {
  const today = new Date();
  const [
    missionCount,
    activeCount,
    agencyCount,
    destinationCount,
    pictured,
    map,
    first,
    latest,
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
    prisma.mission.findFirstOrThrow({
      orderBy: { launchDate: "asc" },
      select: launchSelect,
    }),
    prisma.mission.findFirstOrThrow({
      orderBy: { launchDate: "desc" },
      select: launchSelect,
    }),
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

        <section>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <p className="label-caps text-muted">{label}</p>
                <p className="font-display mt-2 text-3xl">{value}</p>
              </div>
            ))}
          </div>
          <Link
            href="/data"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            More numbers on the data page →
          </Link>
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

        {/* The emblem sits beside the text, or above it on phones. */}
        <section
          id="about"
          className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_16rem] md:gap-12"
        >
          <AboutEmblem className="size-40 md:order-last md:size-64" />

          <div>
            <h2 className="text-2xl font-semibold">About</h2>

            <div className="mt-4 space-y-4 leading-relaxed text-foreground/90">
              <p>
                Mission Atlas is an interactive space mission tracker, built
                to follow and archive the missions launched by space agencies
                from around the world. From{" "}
                <MissionLink mission={first} /> in{" "}
                {first.launchDate.getUTCFullYear()} to{" "}
                <MissionLink mission={latest} /> in{" "}
                {latest.launchDate.getUTCFullYear()}, Mission Atlas can show
                you where {missionCount}{" "}
                missions have been, where they&apos;re going, and what they
                do, all in just a few clicks.
              </p>
              <p>
                Visit the{" "}
                <Link href="/map" className={linkClasses}>
                  Map
                </Link>{" "}
                for a live map of our solar system, showing where landers,
                orbiters, and telescopes are now and the trajectories that took
                them there. Browse the{" "}
                <Link href="/missions" className={linkClasses}>
                  Archive
                </Link>{" "}
                to read about each mission: every mission page has its launch
                details, its spacecraft&apos;s dimensions and characteristics,
                and more. And explore the{" "}
                <Link href="/data" className={linkClasses}>
                  Data
                </Link>{" "}
                page for charts drawn from the whole archive, from destinations
                by decade to launch mass.
              </p>
              <p>
                Launch times and spacecraft details come from Jonathan
                McDowell&apos;s{" "}
                <a
                  href="https://planet4589.org/space/gcat"
                  className={linkClasses}
                >
                  General Catalog of Artificial Space Objects
                </a>
                , and mission details are checked against the operating
                agencies&apos; own pages. Spacecraft positions come from NASA
                JPL&apos;s{" "}
                <a
                  href="https://ssd.jpl.nasa.gov/horizons/"
                  className={linkClasses}
                >
                  Horizons
                </a>{" "}
                system and are refreshed every day. Mission photos come from{" "}
                <a
                  href="https://commons.wikimedia.org"
                  className={linkClasses}
                >
                  Wikimedia Commons
                </a>
                .
              </p>
              {/* A div, not a paragraph: the contact dialog inside it holds
                  paragraphs of its own. */}
              <div>
                Mission Atlas is built and maintained by{" "}
                <a href={AUTHOR.site} className={linkClasses}>
                  {AUTHOR.name}
                </a>
                . Have a question, comment, or concern, or just want to get in
                touch? <ContactDialog />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
