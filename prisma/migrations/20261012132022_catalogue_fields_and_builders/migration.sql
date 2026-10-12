-- AlterTable
ALTER TABLE "Spacecraft" DROP COLUMN "builder",
DROP COLUMN "dimensions",
ADD COLUMN     "catalogueId" TEXT,
ADD COLUMN     "designator" TEXT,
ADD COLUMN     "diameterM" DOUBLE PRECISION,
ADD COLUMN     "dryMassKg" DOUBLE PRECISION,
ADD COLUMN     "lengthM" DOUBLE PRECISION,
ADD COLUMN     "spanM" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Builder" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Builder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BuilderToSpacecraft" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BuilderToSpacecraft_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Builder_code_key" ON "Builder"("code");

-- CreateIndex
CREATE INDEX "_BuilderToSpacecraft_B_index" ON "_BuilderToSpacecraft"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Spacecraft_catalogueId_key" ON "Spacecraft"("catalogueId");

-- AddForeignKey
ALTER TABLE "_BuilderToSpacecraft" ADD CONSTRAINT "_BuilderToSpacecraft_A_fkey" FOREIGN KEY ("A") REFERENCES "Builder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BuilderToSpacecraft" ADD CONSTRAINT "_BuilderToSpacecraft_B_fkey" FOREIGN KEY ("B") REFERENCES "Spacecraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
