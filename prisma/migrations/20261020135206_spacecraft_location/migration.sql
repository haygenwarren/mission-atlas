-- AlterTable
ALTER TABLE "Spacecraft" ADD COLUMN     "horizonsId" TEXT,
ADD COLUMN     "locationId" INTEGER;

-- Existing rows need a location before the column can be required. They get
-- a placeholder here; the seed, which runs straight after migrations on every
-- deploy, replaces it with each craft's real location.
UPDATE "Spacecraft"
SET "locationId" = (SELECT "id" FROM "Destination" WHERE "slug" = 'heliocentric-orbit');

ALTER TABLE "Spacecraft" ALTER COLUMN "locationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Spacecraft_locationId_idx" ON "Spacecraft"("locationId");

-- AddForeignKey
ALTER TABLE "Spacecraft" ADD CONSTRAINT "Spacecraft_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
