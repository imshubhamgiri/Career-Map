/*
  Warnings:

  - The values [NOT_SYNCED] on the enum `GithubSyncStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `completed_at` on the `progress_events` table. All the data in the column will be lost.
  - You are about to drop the column `github_file_path` on the `progress_events` table. All the data in the column will be lost.
  - You are about to drop the column `github_repo` on the `progress_events` table. All the data in the column will be lost.
  - You are about to drop the column `github_sync_status` on the `progress_events` table. All the data in the column will be lost.
  - You are about to drop the column `github_synced_at` on the `progress_events` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `progress_events` table. All the data in the column will be lost.
  - You are about to drop the `verification_codes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id,problem_id]` on the table `progress_events` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LlmStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterEnum
ALTER TYPE "ProgressStatus" ADD VALUE 'NOT_STARTED';

-- DropForeignKey
ALTER TABLE "verification_codes" DROP CONSTRAINT "verification_codes_user_id_fkey";

-- DropIndex
DROP INDEX "progress_events_github_sync_status_idx";

-- DropIndex
DROP INDEX "progress_events_user_id_problem_id_idx";

-- AlterTable
ALTER TABLE "progress_events" DROP COLUMN "completed_at",
DROP COLUMN "github_file_path",
DROP COLUMN "github_repo",
DROP COLUMN "github_sync_status",
DROP COLUMN "github_synced_at",
DROP COLUMN "notes",
ADD COLUMN     "ai_notes" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "solved_at" TIMESTAMP(6),
ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';

-- The legacy GitHub sync column lived on progress_events. The current schema
-- stores this state on submissions, so remove the old column before replacing
-- the enum that it depends on.
DROP TYPE "GithubSyncStatus";
CREATE TYPE "GithubSyncStatus" AS ENUM ('PENDING', 'PROCESSING', 'SYNCED', 'FAILED', 'SKIPPED');

-- DropTable
DROP TABLE "verification_codes";

-- DropEnum
DROP TYPE "VerificationType";

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL DEFAULT 'cos-leet Extension',
    "key_hash" VARCHAR(64) NOT NULL,
    "key_prefix" VARCHAR(16) NOT NULL,
    "last_used_at" TIMESTAMP(6),
    "expires_at" TIMESTAMP(6),
    "revoked_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "github_username" VARCHAR(100) NOT NULL,
    "github_repo" VARCHAR(255) NOT NULL,
    "github_branch" VARCHAR(100) NOT NULL DEFAULT 'main',
    "access_token_encrypted" TEXT NOT NULL,
    "is_configured" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "github_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "problem_id" UUID NOT NULL,
    "progress_event_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "language" VARCHAR(50) NOT NULL,
    "runtime" VARCHAR(50),
    "memory" VARCHAR(50),
    "external_submission_id" VARCHAR(100),
    "llm_status" "LlmStatus" NOT NULL DEFAULT 'PENDING',
    "annotated_code" TEXT,
    "time_complexity" VARCHAR(100),
    "space_complexity" VARCHAR(100),
    "llm_processed_at" TIMESTAMP(6),
    "github_sync_status" "GithubSyncStatus" NOT NULL DEFAULT 'PENDING',
    "github_repo" VARCHAR(255),
    "github_file_path" VARCHAR(500),
    "github_file_sha" VARCHAR(100),
    "github_commit_sha" VARCHAR(100),
    "github_synced_at" TIMESTAMP(6),
    "sync_error" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "github_configs_user_id_key" ON "github_configs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_progress_event_id_key" ON "submissions"("progress_event_id");

-- CreateIndex
CREATE INDEX "submissions_user_id_github_sync_status_idx" ON "submissions"("user_id", "github_sync_status");

-- CreateIndex
CREATE INDEX "submissions_problem_id_idx" ON "submissions"("problem_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_user_id_problem_id_key" ON "submissions"("user_id", "problem_id");

-- CreateIndex
CREATE INDEX "progress_events_user_id_idx" ON "progress_events"("user_id");

-- CreateIndex
CREATE INDEX "progress_events_problem_id_idx" ON "progress_events"("problem_id");

-- CreateIndex
CREATE UNIQUE INDEX "progress_events_user_id_problem_id_key" ON "progress_events"("user_id", "problem_id");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_configs" ADD CONSTRAINT "github_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_progress_event_id_fkey" FOREIGN KEY ("progress_event_id") REFERENCES "progress_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
