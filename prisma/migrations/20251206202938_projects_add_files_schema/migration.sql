/*
  Warnings:

  - You are about to drop the column `floorPlan` on the `room` table. All the data in the column will be lost.
  - You are about to drop the column `generatedImage` on the `room` table. All the data in the column will be lost.
  - You are about to drop the column `generatedVideo` on the `room` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `room` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[floorPlanFileId]` on the table `room` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[imageFileId]` on the table `room` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[generatedImageFileId]` on the table `room` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[generatedVideoFileId]` on the table `room` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `floorPlanFileId` to the `room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "room" DROP COLUMN "floorPlan",
DROP COLUMN "generatedImage",
DROP COLUMN "generatedVideo",
DROP COLUMN "image",
ADD COLUMN     "floorPlanFileId" TEXT NOT NULL,
ADD COLUMN     "generatedImageFileId" TEXT,
ADD COLUMN     "generatedVideoFileId" TEXT,
ADD COLUMN     "imageFileId" TEXT;

-- CreateTable
CREATE TABLE "file" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "room_floorPlanFileId_key" ON "room"("floorPlanFileId");

-- CreateIndex
CREATE UNIQUE INDEX "room_imageFileId_key" ON "room"("imageFileId");

-- CreateIndex
CREATE UNIQUE INDEX "room_generatedImageFileId_key" ON "room"("generatedImageFileId");

-- CreateIndex
CREATE UNIQUE INDEX "room_generatedVideoFileId_key" ON "room"("generatedVideoFileId");

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_floorPlanFileId_fkey" FOREIGN KEY ("floorPlanFileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_imageFileId_fkey" FOREIGN KEY ("imageFileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_generatedImageFileId_fkey" FOREIGN KEY ("generatedImageFileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_generatedVideoFileId_fkey" FOREIGN KEY ("generatedVideoFileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
