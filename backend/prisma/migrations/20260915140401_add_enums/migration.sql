/*
  Warnings:

  - The `difficulty` column on the `problems` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `roadmaps` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `status` on the `progress_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RoadmapStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('UNKNOWN', 'EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('SOLVED', 'ATTEMPTED', 'REVISE');

-- AlterTable
ALTER TABLE "problems" DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "Difficulty" NOT NULL DEFAULT 'UNKNOWN';

-- AlterTable
ALTER TABLE "progress_events" DROP COLUMN "status",
ADD COLUMN     "status" "ProgressStatus" NOT NULL;

-- AlterTable
ALTER TABLE "roadmaps" DROP COLUMN "status",
ADD COLUMN     "status" "RoadmapStatus" NOT NULL DEFAULT 'COMPLETED';

-- CreateIndex
CREATE INDEX "roadmaps_status_idx" ON "roadmaps"("status");
