/*
  Warnings:

  - A unique constraint covering the columns `[defaultFloorPlanFileId]` on the table `project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "project" ADD COLUMN     "defaultFloorPlanFileId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "project_defaultFloorPlanFileId_key" ON "project"("defaultFloorPlanFileId");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_defaultFloorPlanFileId_fkey" FOREIGN KEY ("defaultFloorPlanFileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
