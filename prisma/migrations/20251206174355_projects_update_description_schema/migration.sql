-- AlterTable
ALTER TABLE "project" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "room" ADD COLUMN     "description" TEXT,
ALTER COLUMN "image" DROP NOT NULL;
