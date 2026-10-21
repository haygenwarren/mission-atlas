import Link from "next/link";
import MissionImage, { ImageCredit } from "@/components/mission-image";
import StatusBadge from "@/components/status-badge";
import {
  agencyList,
  destinationList,
  disciplineLabels,
  formatDate,
  missionDuration,
} from "@/lib/missions";
import type { Discipline, Status } from "@/generated/prisma/enums";

type Props = {
  mission: {
    slug: string;
    name: string;
    discipline: Discipline;
    status: Status;
    launchDate: Date;
    lastContact: Date | null;
    endDeclared: Date | null;
    description: string;
    imageUrl: string | null;
    imageCredit: string | null;
    imageLicense: string | null;
    imageLicenseUrl: string | null;
    imageSourceUrl: string | null;
    agencies: { abbreviation: string }[];
    destinations: { name: string }[];
  };
};

const linkClasses =
  "rounded-lg px-5 py-2 font-medium transition-opacity hover:opacity-90";

export default function MissionOfTheDay({ mission }: Props) {
  const duration = missionDuration(mission);

  return (
    <article className="grid overflow-hidden rounded-xl border border-border bg-surface md:grid-cols-2">
      {mission.imageUrl && (
        <MissionImage
          src={mission.imageUrl}
          sizes="(min-width: 1024px) 488px, (min-width: 768px) 50vw, 100vw"
          className="aspect-[3/2] md:aspect-auto md:min-h-80"
        />
      )}

      <div className="flex flex-col p-6 sm:p-8">
        <p className="label-caps text-muted">
          {disciplineLabels[mission.discipline]}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h3 className="font-display text-3xl">{mission.name}</h3>
          <StatusBadge status={mission.status} />
        </div>

        <p className="mt-2 text-muted">
          {agencyList(mission)} · {destinationList(mission)}
        </p>

        <p className="mt-4 leading-relaxed">{mission.description}</p>

        <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <div>
            <dt className="label-caps text-muted">Launched</dt>
            <dd className="mt-1 font-semibold">
              {formatDate(mission.launchDate, "none")}
            </dd>
          </div>
          {duration && (
            <div>
              <dt className="label-caps text-muted">
                {mission.status === "ACTIVE" ? "Active for" : "Duration"}
              </dt>
              <dd className="mt-1 font-semibold">{duration}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/missions/${mission.slug}`}
            className={`${linkClasses} bg-button text-button-text`}
          >
            Read more →
          </Link>
          <Link
            href={`/map?mission=${mission.slug}`}
            className={`${linkClasses} border border-border-strong text-foreground`}
          >
            {mission.status === "ACTIVE"
              ? "See where it is now →"
              : "See where it went →"}
          </Link>
        </div>

        <ImageCredit mission={mission} className="mt-auto pt-6" />
      </div>
    </article>
  );
}
