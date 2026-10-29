-- CreateEnum
CREATE TYPE "MilestoneKind" AS ENUM ('LAUNCH', 'FLYBY', 'ARRIVAL', 'LANDING', 'RELEASE', 'SAMPLE_RETURN', 'OPERATIONS', 'END');

-- CreateEnum
CREATE TYPE "DatePrecision" AS ENUM ('DAY', 'MONTH');

-- CreateTable
CREATE TABLE "Milestone" (
    "id" SERIAL NOT NULL,
    "missionId" INTEGER NOT NULL,
    "spacecraftId" INTEGER,
    "kind" "MilestoneKind" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "date" DATE NOT NULL,
    "precision" "DatePrecision" NOT NULL DEFAULT 'DAY',
    "planned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Milestone_missionId_idx" ON "Milestone"("missionId");

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_spacecraftId_fkey" FOREIGN KEY ("spacecraftId") REFERENCES "Spacecraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
