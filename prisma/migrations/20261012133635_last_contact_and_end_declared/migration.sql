-- AlterTable
ALTER TABLE "Mission" DROP COLUMN "endDate",
DROP COLUMN "endTimeKnown",
ADD COLUMN     "endDeclared" DATE,
ADD COLUMN     "lastContact" TIMESTAMP(3),
ADD COLUMN     "lastContactTimeKnown" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Spacecraft" DROP COLUMN "endDate",
DROP COLUMN "endTimeKnown",
ADD COLUMN     "endDeclared" DATE,
ADD COLUMN     "lastContact" TIMESTAMP(3),
ADD COLUMN     "lastContactTimeKnown" BOOLEAN NOT NULL DEFAULT false;
