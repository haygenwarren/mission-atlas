-- Milestones gain a required description in place of the optional detail.
-- The seed rewrites every milestone on each deploy, so existing rows are
-- cleared rather than migrated.
DELETE FROM "Milestone";

-- AlterTable
ALTER TABLE "Milestone" DROP COLUMN "detail",
ADD COLUMN     "description" TEXT NOT NULL;
