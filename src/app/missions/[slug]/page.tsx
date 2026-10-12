import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  agencyList,
  destinationList,
  disciplineLabels,
  formatDate,
  formatMass,
  formatSize,
  missionLinks,
  powerSourceLabels,
  spacecraftKindLabels,
  statusLabels,
} from "@/lib/missions";
import type { Prisma } from "@/generated/prisma/client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type SpacecraftWithBuilders = Prisma.SpacecraftGetPayload<{
  include: { builders: true };
}>;

function spacecraftFacts(craft: SpacecraftWithBuilders) {
  const facts: [string, string | false | null][] = [
    ["Launch mass", craft.launchMassKg !== null && formatMass(craft.launchMassKg)],
    ["Dry mass", craft.dryMassKg !== null && formatMass(craft.dryMassKg)],
    ["Size", formatSize(craft)],
    ["Power", craft.powerSource && powerSourceLabels[craft.powerSource]],
    ["Built by", craft.builders.map((builder) => builder.name).join(", ")],
    [
      "Ended",
      craft.endDate &&
        formatDate(craft.endDate, craft.endTimeKnown ? "minutes" : "none"),
    ],
    ["Designator", craft.designator],
  ];

  return facts.filter(([, value]) => value);
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const missions = await prisma.mission.findMany({
    select: { slug: true },
  });

  return missions.map(({ slug }) => ({ slug }));
}

export default async function MissionDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const mission = await prisma.mission.findUnique({
    where: { slug },
    include: {
      ...missionLinks,
      spacecraft: {
        orderBy: { id: "asc" },
        include: { builders: { orderBy: { id: "asc" } } },
      },
    },
  });

  if (!mission) {
    notFound();
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-2">{mission.name}</h1>

      <p className="text-gray-600 mb-4">
        {agencyList(mission)} · {statusLabels[mission.status]} ·{" "}
        {destinationList(mission)}
      </p>

      <div className="space-y-2">
        <p>
          <strong>Field:</strong> {disciplineLabels[mission.discipline]}
        </p>
        <p>
          <strong>Launch Date:</strong>{" "}
          {formatDate(mission.launchDate, "seconds")}
        </p>
        {mission.endDate && (
          <p>
            <strong>End Date:</strong>{" "}
            {formatDate(
              mission.endDate,
              mission.endTimeKnown ? "minutes" : "none",
            )}
          </p>
        )}
        <p>
          <strong>Description:</strong> {mission.description}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Spacecraft</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {mission.spacecraft.map((craft) => (
            <div key={craft.id} className="border rounded-xl p-5">
              <h3 className="text-xl font-semibold">{craft.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {spacecraftKindLabels[craft.kind]} ·{" "}
                {statusLabels[craft.status]}
              </p>
              <p className="mt-3 text-sm">{craft.description}</p>

              <div className="mt-4 space-y-1 text-sm">
                {spacecraftFacts(craft).map(([label, value]) => (
                  <p key={label}>
                    <strong>{label}:</strong> {value}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}