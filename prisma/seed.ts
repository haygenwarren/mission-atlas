import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.mission.createMany({
    data: [
        {
            name: "James Webb Space Telescope",
            slug: "jwst",
            agency: "NASA",
            status: "active",
            launchDate: new Date("2021-12-25"),
            target: "Sun-Earth L2",
            missionType: "space telescope",
            description: "Infrared space telescope located at the Sun-Earth L2 point.",
            imageURL: "null",
        },
        {
            name: "Voyager 1",
            slug: "voyager-1",
            agency: "NASA",
            status: "active",
            launchDate: new Date("1977-09-05"),
            target: "Jupiter, Saturn, Interstellar space",
            missionType: "flyby",
            description: "A spacecraft that performed flybys of Jupiter, Saturn, and Saturn's moon Titan. Currently exploring interstellar space.",
            imageURL: "null",
        },
        {
            name: "Voyager 2",
            slug: "voyager-2",
            agency: "NASA",
            status: "active",
            launchDate: new Date("1977-08-20"),
            target: "Jupiter, Saturn, Uranus, Neptune, Interstellar space",
            missionType: "flyby",
            description: "A spacecraft that performed flybys of Jupiter, Saturn, Uranus, and Neptune. Currently exploring interstellar space.",
            imageURL: "null",
        },
        {
            name: "Hubble Space Telescope",
            slug: "hubble",
            agency: "NASA",
            status: "active",
            launchDate: new Date("1990-04-24"),
            target: "low-Earth orbit",
            missionType: "space telescope",
            description: "Space telescope capable of observing the universe in ultraviolet, visible, and infrared light.",
            imageURL: "null",
        }
    ],
    skipDuplicates: true,
  });
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