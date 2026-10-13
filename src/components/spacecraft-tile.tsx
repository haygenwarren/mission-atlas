import Link from "next/link";
import { Fragment } from "react";
import StatusBadge from "@/components/status-badge";
import {
  formatDate,
  formatMass,
  formatSize,
  powerSourceLabels,
  spacecraftKindLabels,
} from "@/lib/missions";
import type { Prisma } from "@/generated/prisma/client";

type SpacecraftWithBuilders = Prisma.SpacecraftGetPayload<{
  include: { builders: true };
}>;

type SpacecraftTileProps = {
  craft: SpacecraftWithBuilders;
  // A mission's only spacecraft takes the full width and lays its facts out
  // in four columns instead of two.
  wide: boolean;
};

const linkClasses = "text-accent hover:underline";

export default function SpacecraftTile({ craft, wide }: SpacecraftTileProps) {
  const facts: [string, React.ReactNode][] = [
    ["Launch mass", craft.launchMassKg !== null && formatMass(craft.launchMassKg)],
    [
      "Dry mass",
      craft.dryMassKg !== null &&
        craft.dryMassKg !== craft.launchMassKg &&
        formatMass(craft.dryMassKg),
    ],
    ["Size", formatSize(craft)],
    ["Power", craft.powerSource && powerSourceLabels[craft.powerSource]],
    [
      "Built by",
      craft.builders.length > 0 &&
        craft.builders.map((builder, i) => (
          <Fragment key={builder.id}>
            {i > 0 && ", "}
            <Link
              href={`/missions?builder=${builder.code}`}
              className={linkClasses}
            >
              {builder.name}
            </Link>
          </Fragment>
        )),
    ],
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

  return (
    <article
      className={`rounded-xl border border-border bg-surface p-5 ${wide ? "md:col-span-2" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">{craft.name}</h3>
          <Link
            href={`/missions?type=${craft.kind.toLowerCase()}`}
            className="label-caps mt-1 inline-block text-muted transition-colors hover:text-foreground"
          >
            {spacecraftKindLabels[craft.kind]}
          </Link>
        </div>
        <StatusBadge status={craft.status} />
      </div>

      <p className="mt-3 text-sm">{craft.description}</p>

      <dl
        className={`mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm ${wide ? "sm:grid-cols-4" : ""}`}
      >
        {facts
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt className="label-caps text-muted">{label}</dt>
              <dd className="mt-1">{value}</dd>
            </div>
          ))}
      </dl>
    </article>
  );
}
