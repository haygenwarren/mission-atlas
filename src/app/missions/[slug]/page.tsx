import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Fragment } from "react";
import { ImageCredit } from "@/components/mission-image";
import MissionTimeline, {
  type TimelineEvent,
} from "@/components/mission-timeline";
import PictureViewer from "@/components/picture-viewer";
import SpacecraftTile from "@/components/spacecraft-tile";
import StatusBadge from "@/components/status-badge";
import type { DatePrecision, MilestoneKind } from "@/generated/prisma/enums";
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
      milestones: {
        orderBy: { date: "asc" },
        include: { spacecraft: { select: { name: true } } },
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

// The mission's milestones, with its launch added if they don't include it.
function timelineEvents(mission: {
  launchDate: Date;
  milestones: {
    id: number;
    kind: MilestoneKind;
    title: string;
    description: string;
    date: Date;
    precision: DatePrecision;
    planned: boolean;
    spacecraft: { name: string } | null;
  }[];
}): TimelineEvent[] {
  const day = (date: Date) => date.toISOString().slice(0, 10);
  const launchListed = mission.milestones.some(
    ({ kind, date }) =>
      kind === "LAUNCH" && day(date) === day(mission.launchDate),
  );
  const events: TimelineEvent[] = mission.milestones.map((milestone) => ({
    key: String(milestone.id),
    title: milestone.title,
    description: milestone.description,
    date: milestone.date.toISOString(),
    precision: milestone.precision,
    planned: milestone.planned,
    end: milestone.kind === "END",
    craft: milestone.spacecraft?.name ?? null,
  }));

  if (!launchListed) {
    events.unshift({
      key: "launch",
      title: "Launch",
      description: null,
      date: mission.launchDate.toISOString(),
      precision: "DAY",
      planned: false,
      end: false,
      craft: null,
    });
  }

  return events;
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface p-4">
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

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/missions"
        className="label-caps text-muted transition-colors hover:text-foreground"
      >
        ← Mission archive
      </Link>

      {/* The picture across the page, cropped to fit, with the title over
          its lower edge. A mission without a picture keeps the dark band. */}
      <header
        className={`relative mt-6 flex flex-col justify-end overflow-hidden rounded-xl border border-border bg-picture ${
          mission.imageUrl ? "min-h-[28rem] sm:aspect-[2/1] sm:min-h-0" : ""
        }`}
      >
        {mission.imageUrl && (
          <>
            <PictureViewer
              src={mission.imageUrl}
              alt={mission.name}
              width={mission.imageWidth}
              height={mission.imageHeight}
              credit={<ImageCredit mission={mission} />}
            />
            {/* A fade from the bottom, so the title reads on any picture. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-picture from-5% via-picture/50 via-35% to-transparent to-65%"
            />
          </>
        )}

        {/* Clicks between the words fall through to the picture. */}
        <div className="pointer-events-none relative flex flex-wrap items-end justify-between gap-x-6 gap-y-4 p-5 sm:p-8">
          <div>
            <p className="label-caps text-picture-accent">
              {disciplineLabels[mission.discipline]}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <h1 className="font-display text-3xl text-picture-text sm:text-4xl">
                {mission.name}
              </h1>
              <StatusBadge status={mission.status} />
            </div>

            <p className="mt-3 text-picture-text">
              {mission.agencies.map((agency, i) => (
                <Fragment key={agency.id}>
                  {i > 0 && <span className="opacity-60"> · </span>}
                  <Link
                    href={`/missions?agency=${encodeURIComponent(agency.abbreviation)}`}
                    title={agency.name}
                    className="pointer-events-auto text-picture-accent hover:underline"
                  >
                    {agency.abbreviation}
                  </Link>
                </Fragment>
              ))}
            </p>
          </div>

          <Link
            href={`/map?mission=${mission.slug}`}
            className="pointer-events-auto shrink-0 rounded-lg bg-picture-accent px-5 py-2 font-medium text-picture transition-opacity hover:opacity-90"
          >
            {mission.status === "ACTIVE"
              ? "See where it is now →"
              : "See where it went →"}
          </Link>
        </div>
      </header>

      <ImageCredit mission={mission} className="mt-2" />

      {/* One strip of facts, with hairlines between them. On phones an odd
          last fact spans both columns rather than leaving a gap. */}
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border max-sm:[&>*:last-child:nth-child(odd)]:col-span-2 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
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

      {mission.milestones.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Milestones</h2>
          <MissionTimeline
            status={mission.status}
            now={new Date().toISOString()}
            events={timelineEvents(mission)}
          />
        </section>
      )}

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
