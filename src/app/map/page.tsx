import type { Metadata } from "next";
import MissionMap from "@/components/map/mission-map";
import { getMapData } from "@/lib/map-data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Map",
  description:
    "Where every spacecraft in the archive is now, on a map of the solar system.",
};

// The facts about each craft are cached with the page; their positions come
// from public/positions.json, which the browser loads itself.
export default async function MapPage() {
  const { craft, names, kinds } = await getMapData();

  return (
    // Fills the window below the navbar.
    <main className="h-[calc(100dvh-73px)] min-h-[28rem]">
      <h1 className="sr-only">Map of the solar system</h1>
      <MissionMap craft={craft} names={names} kinds={kinds} />
    </main>
  );
}
