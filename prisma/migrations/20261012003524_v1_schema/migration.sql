-- The seed file is the source of truth for mission data and is reloaded on
-- every deploy, so existing rows are cleared here rather than converted.
DELETE FROM "Mission";

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('PLANETARY_SCIENCE', 'ASTROPHYSICS');

-- CreateEnum
CREATE TYPE "SpacecraftKind" AS ENUM ('FLYBY', 'ORBITER', 'LANDER', 'ROVER', 'ATMOSPHERIC_PROBE', 'IMPACTOR', 'ROTORCRAFT', 'TELESCOPE');

-- CreateEnum
CREATE TYPE "PowerSource" AS ENUM ('SOLAR', 'RADIOISOTOPE', 'BATTERY');

-- CreateEnum
CREATE TYPE "DestinationKind" AS ENUM ('PLANET', 'DWARF_PLANET', 'MOON', 'ASTEROID', 'COMET', 'ORBIT', 'INTERSTELLAR_SPACE');

-- AlterTable
ALTER TABLE "Mission" DROP COLUMN "agency",
DROP COLUMN "imageURL",
DROP COLUMN "missionType",
DROP COLUMN "target",
ADD COLUMN     "discipline" "Discipline" NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "endTimeKnown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageCredit" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL;

-- CreateTable
CREATE TABLE "Spacecraft" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "SpacecraftKind" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "endDate" TIMESTAMP(3),
    "endTimeKnown" BOOLEAN NOT NULL DEFAULT false,
    "launchMassKg" DOUBLE PRECISION,
    "powerSource" "PowerSource",
    "dimensions" TEXT,
    "builder" TEXT,
    "imageUrl" TEXT,
    "imageCredit" TEXT,
    "missionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spacecraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "country" TEXT,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "DestinationKind" NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AgencyToMission" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AgencyToMission_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DestinationToMission" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DestinationToMission_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Spacecraft_slug_key" ON "Spacecraft"("slug");

-- CreateIndex
CREATE INDEX "Spacecraft_missionId_idx" ON "Spacecraft"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_name_key" ON "Agency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_abbreviation_key" ON "Agency"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_name_key" ON "Destination"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE INDEX "_AgencyToMission_B_index" ON "_AgencyToMission"("B");

-- CreateIndex
CREATE INDEX "_DestinationToMission_B_index" ON "_DestinationToMission"("B");

-- AddForeignKey
ALTER TABLE "Spacecraft" ADD CONSTRAINT "Spacecraft_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgencyToMission" ADD CONSTRAINT "_AgencyToMission_A_fkey" FOREIGN KEY ("A") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgencyToMission" ADD CONSTRAINT "_AgencyToMission_B_fkey" FOREIGN KEY ("B") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DestinationToMission" ADD CONSTRAINT "_DestinationToMission_A_fkey" FOREIGN KEY ("A") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DestinationToMission" ADD CONSTRAINT "_DestinationToMission_B_fkey" FOREIGN KEY ("B") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
