import type { MapCraft } from "@/lib/map-scene";
import { prisma } from "@/lib/prisma";

// The facts the map needs about each craft, and the names and kinds of the
// places they can be, from the database. Their positions come from
// public/positions.json, which the browser loads itself.
export async function getMapData() {
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
            imageUrl: true,
            imageCredit: true,
            imageLicense: true,
            imageLicenseUrl: true,
            imageSourceUrl: true,
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

  return { craft, names, kinds };
}
