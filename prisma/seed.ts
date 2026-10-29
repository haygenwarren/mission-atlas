import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { agencies } from "./data/agencies";
import { builderAliases, builders } from "./data/builders";
import { catalogue } from "./data/catalogue";
import { destinations } from "./data/destinations";
import { images } from "./data/images";
import { milestones, type MilestoneSeed } from "./data/milestones";
import { missions, type SpacecraftSeed } from "./data/missions";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const builderCodes = new Set<string>(builders.map(({ code }) => code));

function catalogueRecord(craft: SpacecraftSeed) {
  if (!craft.catalogueId) return undefined;

  const record = catalogue[craft.catalogueId];

  if (!record) {
    throw new Error(
      `${craft.slug}: ${craft.catalogueId} is not in catalogue.json. Run "npm run import:catalogue".`,
    );
  }

  return record;
}

// A value set in the data file wins, including null; otherwise the catalogue
// value is used.
function pick<T>(own: T | null | undefined, fromCatalogue?: T | null) {
  return own !== undefined ? own : (fromCatalogue ?? null);
}

// "2018-11-15" is a day; "2017-09-15T11:55:46Z" also carries a time.
function toDate(value?: string | null) {
  return value ? new Date(value) : null;
}

function hasTime(value?: string | null) {
  return Boolean(value?.includes("T"));
}

// A milestone's date: "2004-07-01" is a day, "2031-07" only a month.
function milestoneDate(mission: string, milestone: MilestoneSeed) {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(milestone.date);

  if (!match) {
    throw new Error(
      `${mission}: milestone "${milestone.title}" has date "${milestone.date}"; write it as "2004-07-01" or "2031-07".`,
    );
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(+year, +month - 1, day ? +day : 1));
  // The last moment the event could fall on, to check plans against today.
  const latest = day
    ? new Date(Date.UTC(+year, +month - 1, +day + 1))
    : new Date(Date.UTC(+year, +month, 1));

  if (milestone.planned && latest < new Date()) {
    console.warn(
      `${mission}: "${milestone.title}" was planned for ${milestone.date}. Mark it done with the actual date, or update the plan.`,
    );
  }

  if (!milestone.planned && date > new Date()) {
    throw new Error(
      `${mission}: "${milestone.title}" is dated ${milestone.date}, in the future; mark it planned.`,
    );
  }

  return { date, precision: day ? ("DAY" as const) : ("MONTH" as const) };
}

function craftBuilders(craft: SpacecraftSeed) {
  const listed = craft.builders ?? catalogueRecord(craft)?.builders ?? [];
  const codes = [
    ...new Set(listed.map((code) => builderAliases[code] ?? code)),
  ];
  const unknown = codes.filter((code) => !builderCodes.has(code));

  if (unknown.length > 0) {
    throw new Error(
      `${craft.slug}: add ${unknown.join(", ")} to prisma/data/builders.ts.`,
    );
  }

  return codes.map((code) => ({ code }));
}

// Makes the database match the files in prisma/data: rows are created or
// updated by their slug, and rows no longer in the files are deleted. It all
// runs in one transaction, so a failure leaves the database as it was.
async function main() {
  await prisma.$transaction(
    async (tx) => {
      for (const agency of agencies) {
        await tx.agency.upsert({
          where: { abbreviation: agency.abbreviation },
          update: agency,
          create: agency,
        });
      }

      const destinationIds = new Map<string, number>();
      const missionIds = new Map<string, number>();
      // Each mission's launch day (UTC), to check its milestones against.
      const launchDays = new Map<string, string>();
      const craftIds = new Map<string, { id: number; mission: string }>();

      for (const destination of destinations) {
        const saved = await tx.destination.upsert({
          where: { slug: destination.slug },
          update: destination,
          create: destination,
        });
        destinationIds.set(saved.slug, saved.id);
      }

      for (const builder of builders) {
        await tx.builder.upsert({
          where: { code: builder.code },
          update: builder,
          create: builder,
        });
      }

      for (const mission of missions) {
        const firstCraft = mission.spacecraft[0];
        const launchDate =
          mission.launchDate ??
          (firstCraft && catalogueRecord(firstCraft)?.launchDate);

        if (!launchDate) {
          throw new Error(`${mission.slug}: no launch date.`);
        }

        const image = mission.image ? images[mission.slug] : undefined;

        if (mission.image && image?.file !== mission.image) {
          throw new Error(
            `${mission.slug}: ${mission.image} is not in images.json. Run "npm run import:images".`,
          );
        }

        const fields = {
          slug: mission.slug,
          name: mission.name,
          discipline: mission.discipline,
          status: mission.status,
          launchDate: new Date(launchDate),
          lastContact: toDate(mission.lastContact),
          lastContactTimeKnown: hasTime(mission.lastContact),
          endDeclared: toDate(mission.endDeclared),
          description: mission.description,
          imageUrl: image?.url ?? null,
          imageWidth: image?.width ?? null,
          imageHeight: image?.height ?? null,
          imageCredit: image?.author ?? null,
          imageLicense: image?.license ?? null,
          imageLicenseUrl: image?.licenseUrl ?? null,
          imageSourceUrl: image?.source ?? null,
          sourceUrl: mission.sourceUrl ?? null,
        };
        const agencyLinks = mission.agencies.map((abbreviation) => ({
          abbreviation,
        }));
        const destinationLinks = mission.destinations.map((slug) => ({ slug }));

        const saved = await tx.mission.upsert({
          where: { slug: mission.slug },
          update: {
            ...fields,
            agencies: { set: agencyLinks },
            destinations: { set: destinationLinks },
          },
          create: {
            ...fields,
            agencies: { connect: agencyLinks },
            destinations: { connect: destinationLinks },
          },
        });

        missionIds.set(mission.slug, saved.id);
        launchDays.set(
          mission.slug,
          saved.launchDate.toISOString().slice(0, 10),
        );

        // A mission's only spacecraft shares its status and end dates. With
        // more than one, each states its own and nothing is borrowed.
        const soleCraft = mission.spacecraft.length === 1;

        for (const craft of mission.spacecraft) {
          const record = catalogueRecord(craft);
          const builderLinks = craftBuilders(craft);

          if (!soleCraft && !craft.status) {
            throw new Error(
              `${craft.slug}: set a status. ${mission.slug} has more than one spacecraft, so each states its own.`,
            );
          }

          const lastContact = soleCraft
            ? pick(craft.lastContact, mission.lastContact)
            : (craft.lastContact ?? null);
          const endDeclared = soleCraft
            ? pick(craft.endDeclared, mission.endDeclared)
            : (craft.endDeclared ?? null);
          const craftFields = {
            slug: craft.slug,
            name: craft.name,
            catalogueId: craft.catalogueId ?? null,
            designator: pick(craft.designator, record?.designator),
            kind: craft.kind,
            description: craft.description,
            status: craft.status ?? mission.status,
            lastContact: toDate(lastContact),
            lastContactTimeKnown: hasTime(lastContact),
            endDeclared: toDate(endDeclared),
            launchMassKg: pick(craft.launchMassKg, record?.launchMassKg),
            dryMassKg: pick(craft.dryMassKg, record?.dryMassKg),
            lengthM: pick(craft.lengthM, record?.lengthM),
            diameterM: pick(craft.diameterM, record?.diameterM),
            spanM: pick(craft.spanM, record?.spanM),
            powerSource: craft.powerSource ?? null,
            imageUrl: craft.imageUrl ?? null,
            imageCredit: craft.imageCredit ?? null,
            locationId: destinationIds.get(craft.location)!,
            horizonsId: craft.horizonsId ?? null,
            missionId: saved.id,
          };

          const savedCraft = await tx.spacecraft.upsert({
            where: { slug: craft.slug },
            update: { ...craftFields, builders: { set: builderLinks } },
            create: { ...craftFields, builders: { connect: builderLinks } },
          });

          craftIds.set(craft.slug, {
            id: savedCraft.id,
            mission: mission.slug,
          });
        }
      }

      // Milestones have nothing to match them by, so they are replaced
      // wholesale.
      await tx.milestone.deleteMany();

      const milestoneRows = Object.entries(milestones).flatMap(
        ([mission, events]) => {
          const missionId = missionIds.get(mission);

          if (!missionId) {
            throw new Error(
              `prisma/data/milestones.ts lists "${mission}", which is not a mission.`,
            );
          }

          // Nothing happens before the launch, and a listed launch must be on
          // the launch day, or the timeline would show the launch twice.
          const launchDay = launchDays.get(mission)!;
          const firstLaunch = events.find(({ kind }) => kind === "LAUNCH");

          for (const event of events) {
            if (
              event.date.slice(0, 10) < launchDay.slice(0, event.date.length)
            ) {
              throw new Error(
                `${mission}: "${event.title}" is dated ${event.date}, before the launch on ${launchDay}.`,
              );
            }
          }

          if (firstLaunch && firstLaunch.date !== launchDay) {
            throw new Error(
              `${mission}: its launch milestone is dated ${firstLaunch.date}, but it launched on ${launchDay}.`,
            );
          }

          return events.map((event) => {
            const craft = event.spacecraft
              ? craftIds.get(event.spacecraft)
              : undefined;

            if (event.spacecraft && craft?.mission !== mission) {
              throw new Error(
                `${mission}: milestone "${event.title}" names spacecraft "${event.spacecraft}", which is not one of its craft.`,
              );
            }

            return {
              missionId,
              spacecraftId: craft ? craft.id : null,
              kind: event.kind,
              title: event.title,
              description: event.description,
              planned: event.planned ?? false,
              ...milestoneDate(mission, event),
            };
          });
        },
      );

      await tx.milestone.createMany({ data: milestoneRows });

      const craftSlugs = missions.flatMap((mission) =>
        mission.spacecraft.map((craft) => craft.slug),
      );

      await tx.spacecraft.deleteMany({
        where: { slug: { notIn: craftSlugs } },
      });
      await tx.mission.deleteMany({
        where: { slug: { notIn: missions.map((mission) => mission.slug) } },
      });
      await tx.destination.deleteMany({
        where: { slug: { notIn: destinations.map(({ slug }) => slug) } },
      });
      await tx.agency.deleteMany({
        where: {
          abbreviation: {
            notIn: agencies.map(({ abbreviation }) => abbreviation),
          },
        },
      });
      await tx.builder.deleteMany({
        where: { code: { notIn: builders.map(({ code }) => code) } },
      });

      console.log(
        `Seeded ${missions.length} missions, ${craftSlugs.length} spacecraft, ${milestoneRows.length} milestones, ${agencies.length} agencies, ${destinations.length} destinations, ${builders.length} builders.`,
      );
    },
    { maxWait: 15_000, timeout: 120_000 },
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
