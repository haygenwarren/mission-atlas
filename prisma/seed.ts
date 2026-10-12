import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { agencies } from "./data/agencies";
import { destinations } from "./data/destinations";
import { missions } from "./data/missions";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

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

      for (const mission of missions) {
        const fields = {
          slug: mission.slug,
          name: mission.name,
          discipline: mission.discipline,
          status: mission.status,
          launchDate: new Date(mission.launchDate),
          endDate: mission.endDate ? new Date(mission.endDate) : null,
          endTimeKnown: mission.endTimeKnown ?? false,
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

        for (const craft of mission.spacecraft) {
          const craftFields = {
            slug: craft.slug,
            name: craft.name,
            kind: craft.kind,
            description: craft.description,
            status: craft.status,
            endDate: craft.endDate ? new Date(craft.endDate) : null,
            endTimeKnown: craft.endTimeKnown ?? false,
            launchMassKg: craft.launchMassKg ?? null,
            powerSource: craft.powerSource ?? null,
            dimensions: craft.dimensions ?? null,
            builder: craft.builder ?? null,
            imageUrl: craft.imageUrl ?? null,
            imageCredit: craft.imageCredit ?? null,
            missionId: saved.id,
          };

          await tx.spacecraft.upsert({
            where: { slug: craft.slug },
            update: craftFields,
            create: craftFields,
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

      console.log(
        `Seeded ${missions.length} missions, ${craftSlugs.length} spacecraft, ${agencies.length} agencies, ${destinations.length} destinations.`,
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
