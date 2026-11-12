import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

// Every page worth finding in a search engine: the four main pages and
// each mission's page. The archive's filtered views are left out, since
// they show the same missions.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const missions = await prisma.mission.findMany({
    select: { slug: true },
    orderBy: { launchDate: "asc" },
  });

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/map`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/missions`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/data`, changeFrequency: "weekly", priority: 0.6 },
    ...missions.map(({ slug }) => ({
      url: `${siteUrl}/missions/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
