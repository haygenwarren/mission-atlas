import type { Metadata } from "next";
import MissionMap from "@/components/map/mission-map";
import type { MapCraft } from "@/lib/map-scene";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Map",
  description:
    "Where every spacecraft in the archive is now, on a map of the solar system.",
};

// The facts about each craft come from the database and are cached with the
// page; their positions come from public/positions.json, which the browser
// loads itself.
export default async function MapPage() {
  const [rows, destinations] = await Promise.all([
    prisma.spacecraft.findMany({
      select: {
        slug: true,
        name: true,
        status: true,
        horizonsId: true,
        lastContact: true,
        location: { select: { slug: true } },
        mission: {
          select: {
            slug: true,
            name: true,
            status: true,
            agencies: {
              select: { abbreviation: true, name: true },
              orderBy: { abbreviation: "asc" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.destination.findMany({
      select: { slug: true, name: true, kind: true },
    }),
  ]);

  const craft: MapCraft[] = rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    status: row.status,
    horizonsId: row.horizonsId,
    location: row.location.slug as MapCraft["location"],
    lastContact: row.lastContact?.toISOString() ?? null,
    mission: row.mission,
  }));

  const names = {
    earth: "Earth",
    ...Object.fromEntries(destinations.map(({ slug, name }) => [slug, name])),
  };
  const kinds = {
    earth: "PLANET" as const,
    ...Object.fromEntries(destinations.map(({ slug, kind }) => [slug, kind])),
  };

  return (
    // Fills the window below the navbar.
    <main className="h-[calc(100dvh-73px)] min-h-[28rem]">
      <h1 className="sr-only">Map of the solar system</h1>
      <MissionMap craft={craft} names={names} kinds={kinds} />
    </main>
  );
}
