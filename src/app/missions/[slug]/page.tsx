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
    [
      "Dry mass",
      craft.dryMassKg !== null &&
        craft.dryMassKg !== craft.launchMassKg &&
        formatMass(craft.dryMassKg),
    ],
    ["Size", formatSize(craft)],
    ["Power", craft.powerSource && powerSourceLabels[craft.powerSource]],
    ["Built by", craft.builders.map((builder) => builder.name).join(", ")],
    [
      "Last contact",
      craft.lastContact &&
        formatDate(
          craft.lastContact,
          craft.lastContactTimeKnown ? "seconds" : "none",
        ),
    ],
    ["End declared", craft.endDeclared && formatDate(craft.endDeclared, "none")],
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
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="font-display mb-2 text-3xl">{mission.name}</h1>

      <p className="mb-4 text-muted">
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
        {mission.lastContact && (
          <p>
            <strong>Last Contact:</strong>{" "}
            {formatDate(
              mission.lastContact,
              mission.lastContactTimeKnown ? "seconds" : "none",
            )}
          </p>
        )}
        {mission.endDeclared && (
          <p>
            <strong>End Declared:</strong>{" "}
            {formatDate(mission.endDeclared, "none")}
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
            <div
              key={craft.id}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <h3 className="text-xl font-semibold">{craft.name}</h3>
              <p className="mt-1 text-sm text-muted">
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