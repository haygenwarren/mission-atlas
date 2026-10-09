import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
  });

  if (!mission) {
    notFound();
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-2">{mission.name}</h1>

      <p className="text-gray-600 mb-4">
        {mission.agency} · {mission.status} · {mission.target}
      </p>

      <div className="space-y-2">
        <p>
          <strong>Mission Type:</strong> {mission.missionType}
        </p>
        <p>
          <strong>Launch Date:</strong>{" "}
          {mission.launchDate
            ? new Date(mission.launchDate).toLocaleDateString()
            : "Unknown"}
        </p>
        <p>
          <strong>Description:</strong> {mission.description}
        </p>
      </div>
    </main>
  );
}