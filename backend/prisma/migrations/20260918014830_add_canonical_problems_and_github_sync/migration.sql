-- CreateEnum
CREATE TYPE "GithubSyncStatus" AS ENUM ('NOT_SYNCED', 'PENDING', 'SYNCED', 'FAILED');

-- DropForeignKey
ALTER TABLE "problems" DROP CONSTRAINT "problems_roadmap_id_fkey";

-- DropIndex
DROP INDEX "problems_roadmap_id_idx";

-- AlterTable
ALTER TABLE "problems" DROP COLUMN "roadmap_id",
DROP COLUMN "topic",
ADD COLUMN     "platform" VARCHAR(100),
ADD COLUMN     "platform_problem_id" VARCHAR(100),
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "canonical_slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "progress_events" ADD COLUMN     "github_file_path" VARCHAR(255),
ADD COLUMN     "github_repo" VARCHAR(255),
ADD COLUMN     "github_sync_status" "GithubSyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
ADD COLUMN     "github_synced_at" TIMESTAMP(6),
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "roadmap_problems" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "roadmap_id" UUID NOT NULL,
    "problem_id" UUID NOT NULL,
    "topic" VARCHAR(255) NOT NULL,
    "original_title" VARCHAR(255) NOT NULL,
    "original_url" TEXT,
    "original_category" VARCHAR(255),
    "original_difficulty" "Difficulty" NOT NULL DEFAULT 'UNKNOWN',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmap_problems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roadmap_problems_roadmap_id_idx" ON "roadmap_problems"("roadmap_id");

-- CreateIndex
CREATE INDEX "roadmap_problems_problem_id_idx" ON "roadmap_problems"("problem_id");

-- CreateIndex
CREATE UNIQUE INDEX "roadmap_problems_roadmap_id_problem_id_key" ON "roadmap_problems"("roadmap_id", "problem_id");

-- CreateIndex
CREATE UNIQUE INDEX "problems_canonical_slug_key" ON "problems"("canonical_slug");

-- CreateIndex
CREATE INDEX "progress_events_github_sync_status_idx" ON "progress_events"("github_sync_status");

-- AddForeignKey
ALTER TABLE "roadmap_problems" ADD CONSTRAINT "roadmap_problems_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_problems" ADD CONSTRAINT "roadmap_problems_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

