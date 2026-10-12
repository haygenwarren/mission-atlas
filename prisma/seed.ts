import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { agencies } from "./data/agencies";
import { builderAliases, builders } from "./data/builders";
import { catalogue } from "./data/catalogue";
import { destinations } from "./data/destinations";
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

      for (const destination of destinations) {
        await tx.destination.upsert({
          where: { slug: destination.slug },
          update: destination,
          create: destination,
        });
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
          imageUrl: mission.imageUrl ?? null,
          imageCredit: mission.imageCredit ?? null,
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
            missionId: saved.id,
          };

          await tx.spacecraft.upsert({
            where: { slug: craft.slug },
            update: { ...craftFields, builders: { set: builderLinks } },
            create: { ...craftFields, builders: { connect: builderLinks } },
          });
        }
      }

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
        `Seeded ${missions.length} missions, ${craftSlugs.length} spacecraft, ${agencies.length} agencies, ${destinations.length} destinations, ${builders.length} builders.`,
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
