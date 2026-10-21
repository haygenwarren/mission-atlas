import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Fragment } from "react";
import { ImageCredit } from "@/components/mission-image";
import SpacecraftTile from "@/components/spacecraft-tile";
import StatusBadge from "@/components/status-badge";
import { prisma } from "@/lib/prisma";
import {
  disciplineLabels,
  formatDate,
  formatTime,
  missionDuration,
  missionLinks,
} from "@/lib/missions";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Both the page and its title need the mission; cache() makes them share one
// database query per request.
const getMission = cache((slug: string) =>
  prisma.mission.findUnique({
    where: { slug },
    include: {
      ...missionLinks,
      spacecraft: {
        orderBy: { id: "asc" },
        include: { builders: { orderBy: { id: "asc" } } },
      },
    },
  }),
);

export const revalidate = 3600;

export async function generateStaticParams() {
  const missions = await prisma.mission.findMany({
    select: { slug: true },
  });

  return missions.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const mission = await getMission((await params).slug);

  return mission
    ? { title: mission.name, description: mission.description }
    : {};
}

const linkClasses = "text-accent hover:underline";

// The picture beside the title keeps its own shape, as large as fits in this
// box, so none is cropped.
const PICTURE_WIDTH = 416;
const PICTURE_HEIGHT = 288;

function fitPicture(width: number, height: number) {
  const scale = Math.min(PICTURE_WIDTH / width, PICTURE_HEIGHT / height, 1);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <dt className="label-caps text-muted">{label}</dt>
      <dd className="mt-2 font-semibold">{children}</dd>
    </div>
  );
}

function Detail({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 block text-sm font-normal text-muted">
      {children}
    </span>
  );
}

export default async function MissionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const mission = await getMission(slug);

  if (!mission) {
    notFound();
  }

  const duration = missionDuration(mission);
  const picture =
    mission.imageUrl && mission.imageWidth && mission.imageHeight
      ? {
          src: mission.imageUrl,
          ...fitPicture(mission.imageWidth, mission.imageHeight),
        }
      : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/missions"
        className="label-caps text-muted transition-colors hover:text-foreground"
      >
        ← Mission archive
      </Link>

      <header className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="label-caps text-muted">
            {disciplineLabels[mission.discipline]}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="font-display text-4xl">{mission.name}</h1>
            <StatusBadge status={mission.status} />
          </div>

          <p className="mt-3">
            {mission.agencies.map((agency, i) => (
              <Fragment key={agency.id}>
                {i > 0 && <span className="text-muted"> · </span>}
                <Link
                  href={`/missions?agency=${encodeURIComponent(agency.abbreviation)}`}
                  title={agency.name}
                  className={linkClasses}
                >
                  {agency.abbreviation}
                </Link>
              </Fragment>
            ))}
          </p>

          <Link
            href={`/map?mission=${mission.slug}`}
            className="mt-5 inline-block rounded-lg bg-button px-5 py-2 font-medium text-button-text transition-opacity hover:opacity-90"
          >
            See where it is now →
          </Link>
        </div>

        {picture && (
          <figure className="w-fit shrink-0">
            <Image
              src={picture.src}
              alt={mission.name}
              width={picture.width}
              height={picture.height}
              preload
              className="h-auto max-w-full rounded-xl border border-border bg-picture"
            />
            {/* The credit wraps to the picture's width. */}
            <figcaption className="w-0 min-w-full">
              <ImageCredit mission={mission} className="mt-2" />
            </figcaption>
          </figure>
        )}
      </header>

      <dl className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-4">
        <Fact label="Launched">
          {formatDate(mission.launchDate, "none")}
          <Detail>{formatTime(mission.launchDate)}</Detail>
        </Fact>

        {mission.lastContact && (
          <Fact label="Last contact">
            {formatDate(mission.lastContact, "none")}
            {mission.lastContactTimeKnown && (
              <Detail>{formatTime(mission.lastContact)}</Detail>
            )}
          </Fact>
        )}

        {mission.endDeclared && (
          <Fact label="End declared">
            {formatDate(mission.endDeclared, "none")}
          </Fact>
        )}

        {duration && (
          <Fact label={mission.status === "ACTIVE" ? "Active for" : "Duration"}>
            {duration}
          </Fact>
        )}

        <Fact label="Destinations">
          {mission.destinations.map((destination, i) => (
            <Fragment key={destination.id}>
              {i > 0 && ", "}
              <Link
                href={`/missions?destination=${destination.slug}`}
                className={linkClasses}
              >
                {destination.name}
              </Link>
            </Fragment>
          ))}
        </Fact>
      </dl>

      <p className="mt-8 max-w-3xl text-lg leading-relaxed">
        {mission.description}
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Spacecraft</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {mission.spacecraft.map((craft) => (
            <SpacecraftTile
              key={craft.id}
              craft={craft}
              wide={mission.spacecraft.length === 1}
            />
          ))}
        </div>
      </section>

      {mission.sourceUrl && (
        <p className="mt-10 text-sm text-muted">
          Mission details from{" "}
          <a href={mission.sourceUrl} className="text-accent underline">
            {new URL(mission.sourceUrl).hostname.replace(/^www\./, "")}
          </a>
          .
        </p>
      )}
    </main>
  );
}
