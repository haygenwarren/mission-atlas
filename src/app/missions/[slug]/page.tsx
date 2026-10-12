import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  agencyList,
  destinationList,
  disciplineLabels,
  formatDate,
  missionLinks,
  statusLabels,
} from "@/lib/missions";

type PageProps = {
  params: Promise<{ slug: string }>;
};

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
    include: missionLinks,
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
          <strong>Launch Date:</strong> {formatDate(mission.launchDate)}
        </p>
        <p>
          <strong>Description:</strong> {mission.description}
        </p>
      </div>
    </main>
  );
}