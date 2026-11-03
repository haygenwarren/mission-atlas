import type { Metadata } from "next";
import Link from "next/link";
import LaunchMass from "@/components/charts/launch-mass";
import MissionsPerYear from "@/components/charts/missions-per-year";
import StatusBars from "@/components/charts/status-bars";
import {
  launchMasses,
  missionsByAgency,
  missionsByDestination,
  missionsByYear,
} from "@/lib/data";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Data",
  description:
    "The missions in the archive in numbers: when they launched, where they went, who flew them and how heavy they were.",
};

function Section({
  title,
  intro,
  note,
  children,
}: {
  title: string;
  intro: React.ReactNode;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-3xl text-muted">{intro}</p>
      </div>
      {children}
      {note && <p className="max-w-3xl text-sm text-muted">{note}</p>}
    </section>
  );
}

// The charts are drawn in the browser, which needs a hover for each bar and
// dot; the numbers are worked out here, from the database.
export default async function DataPage() {
  const missions = await prisma.mission.findMany({
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

  const destinations = missionsByDestination(missions);
  // Destinations with a single mission are listed rather than drawn: a bar
  // of one, over and over, says less than their names.
  const shared = destinations.filter(({ total }) => total > 1);
  const single = destinations.filter(({ total }) => total === 1);
  const masses = launchMasses(missions);
  const unweighed = missions.length - masses.length;
  const [lightest, heaviest] = [
    masses.reduce((a, b) => (b.massKg < a.massKg ? b : a)),
    masses.reduce((a, b) => (b.massKg > a.massKg ? b : a)),
  ];
  const kg = (mass: number) =>
    `${Math.round(mass).toLocaleString("en-GB")} kg`;

  return (
    <main className="mx-auto max-w-5xl space-y-16 px-6 py-10">
      <header>
        <h1 className="font-display text-3xl sm:text-4xl">
          The missions in numbers
        </h1>
        <p className="mt-3 max-w-3xl text-lg">
          When the {missions.length} missions in the archive launched, where
          they went, who flew them and how heavy they were. These are the
          missions chosen for the archive, not every mission ever flown. Point
          at a bar or dot for its details, and click it to see the missions
          themselves.
        </p>
      </header>

      <Section
        title="Missions per year"
        intro="Each block is a mission, coloured by where it went. Telescopes are grouped together, wherever they orbit."
      >
        <MissionsPerYear columns={missionsByYear(missions)} />
      </Section>

      <Section
        title="Where they went"
        intro="Each place a mission set out to study, land on or work from. Cassini–Huygens counts for Jupiter, Saturn and Titan, so the bars add up to more than the number of missions."
        note={
          <>
            Visited by one mission each:{" "}
            {single.map((destination, i) => (
              <span key={destination.key}>
                {i > 0 && ", "}
                <Link
                  href={destination.href}
                  className="text-accent hover:underline"
                >
                  {destination.label}
                </Link>
              </span>
            ))}
            .
          </>
        }
      >
        <StatusBars rows={shared} />
      </Section>

      <Section
        title="Who flew them"
        intro="The space agencies behind each mission. A mission run by several agencies counts for each of them: Cassini–Huygens for NASA, ESA and ASI."
      >
        <StatusBars rows={missionsByAgency(missions)} />
      </Section>

      <Section
        title="Launch mass"
        intro={`How much each mission weighed at launch, from ${lightest.name} at ${kg(lightest.massKg)} to ${heaviest.name} at ${kg(heaviest.massKg)}. The scale grows by powers of ten: from 100 kg to 1,000 kg takes as much room as from 1,000 kg to 10,000 kg.`}
        note={`A mission's mass is its spacecraft's launch masses added up, as the catalogue records them: a rover catalogued on its own, such as Spirit, appears without its cruise stage.${
          unweighed > 0
            ? ` ${unweighed} mission${unweighed === 1 ? " has" : "s have"} no recorded mass and ${unweighed === 1 ? "is" : "are"} left out.`
            : ""
        }`}
      >
        <LaunchMass points={masses} />
      </Section>
    </main>
  );
}
