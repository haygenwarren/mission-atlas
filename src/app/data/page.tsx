import type { Metadata } from "next";
import { Suspense } from "react";
import Dashboard from "@/components/data/dashboard";
import { missionFacts } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Data",
  description:
    "The missions in the archive in numbers: when they launched, where they went, who flew them and how heavy they were, with filters.",
};

// The facts are gathered here, and the dashboard filters and charts them in
// the browser. It reads its filters from the address, which a page built
// ahead of time cannot know, so it waits behind Suspense until the browser
// has them.
export default async function DataPage() {
  const rows = await prisma.mission.findMany({
    select: {
      slug: true,
      name: true,
      status: true,
      discipline: true,
      launchDate: true,
      agencies: {
        select: { abbreviation: true, name: true },
        orderBy: { id: "asc" },
      },
      destinations: {
        select: { slug: true, name: true, kind: true },
        orderBy: { id: "asc" },
      },
      spacecraft: { select: { launchMassKg: true }, orderBy: { id: "asc" } },
    },
    orderBy: { launchDate: "asc" },
  });
  const missions = rows.map(missionFacts);

  return (
    <main>
      <header className="mx-auto max-w-5xl px-6 pt-10 pb-6">
        <h1 className="font-display text-3xl sm:text-4xl">
          The missions in numbers
        </h1>
        <p className="mt-3 max-w-3xl text-lg">
          When the {missions.length} missions in the archive launched, where
          they went, who flew them and how heavy they were. These are the
          missions chosen for the archive, not every mission ever flown. Narrow
          them with the filters, or click a bar or square to show only its
          missions.
        </p>
      </header>

      <Suspense
        fallback={
          <p className="mx-auto max-w-5xl px-6 py-16 text-muted">
            Loading the charts…
          </p>
        }
      >
        <Dashboard missions={missions} />
      </Suspense>
    </main>
  );
}
