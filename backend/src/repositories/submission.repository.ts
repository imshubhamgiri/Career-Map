import prisma from '../config/db';
import {
  Submission,
  Problem,
  ProgressEvent,
  LlmStatus,
  GithubSyncStatus,
  Prisma,
} from '@prisma/client';

export type SubmissionWithRelations = Submission & {
  problem: Problem;
  progressEvent: ProgressEvent;
};

export interface CreateSubmissionInput {
  userId: string;
  problemId: string;
  progressEventId: string;
  code: string;
  codeHash: string;
  language: string;
  runtime?: string | null;
  memory?: string | null;
  externalSubmissionId?: string | null;
  llmStatus?: LlmStatus;
  githubSyncStatus?: GithubSyncStatus;
}

export interface UpdateSubmissionCodeInput {
  code: string;
  codeHash: string;
  language: string;
  runtime?: string | null;
  memory?: string | null;
  externalSubmissionId?: string | null;
}

export interface LlmCheckpointInput {
  annotatedCode: string;
  platformNotes: string;
  timeComplexity: string;
  spaceComplexity: string;
}

export interface GithubSyncedInput {
  githubRepo: string;
  githubFilePath: string;
  githubFileSha: string;
  githubCommitSha: string;
}

export class SubmissionRepository {
  /**
   * Create a new submission record (Case A: First-time solve).
   */
  createSubmission(
    data: CreateSubmissionInput,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<Submission> {
    return tx.submission.create({
      data: {
        userId: data.userId,
        problemId: data.problemId,
        progressEventId: data.progressEventId,
        code: data.code,
        codeHash: data.codeHash,
        language: data.language,
        runtime: data.runtime ?? null,
        memory: data.memory ?? null,
        externalSubmissionId: data.externalSubmissionId ?? null,
        llmStatus: data.llmStatus ?? LlmStatus.PENDING,
        githubSyncStatus: data.githubSyncStatus ?? GithubSyncStatus.PENDING,
      },
    });
  }

  /**
   * Fetch a submission by its primary key UUID, including its canonical Problem and ProgressEvent.
   */
  findById(
    id: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<SubmissionWithRelations | null> {
    return tx.submission.findUnique({
      where: { id },
      include: {
        problem: true,
        progressEvent: true,
      },
    });
  }

  /**
   * Alias for `findById` for backward compatibility.
   */
  getSubmissionById(
    id: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<SubmissionWithRelations | null> {
    return this.findById(id, tx);
  }

  /**
   * Fetch a user's unique submission for a problem via the composite unique key `(userId, problemId)`.
   */
  findByUserAndProblem(
    userId: string,
    problemId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<SubmissionWithRelations | null> {
    return tx.submission.findUnique({
      where: {
        userId_problemId: {
          userId,
          problemId,
        },
      },
      include: {
        problem: true,
        progressEvent: true,
      },
    });
  }

  /**
   * Case B (Identical code revision): Touch `updatedAt` and optional runtime/memory metrics
   * without overwriting `annotatedCode` or resetting `llmStatus` / `githubSyncStatus`.
   */
  touchSubmission(
    id: string,
    metrics?: {
      runtime?: string | null;
      memory?: string | null;
      externalSubmissionId?: string | null;
    },
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<Submission> {
    return tx.submission.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        ...(metrics?.runtime !== undefined && { runtime: metrics.runtime }),
        ...(metrics?.memory !== undefined && { memory: metrics.memory }),
        ...(metrics?.externalSubmissionId !== undefined && {
          externalSubmissionId: metrics.externalSubmissionId,
        }),
      },
    });
  }

  /**
   * Case C (Different/better solution code): Update code and codeHash in-place and reset
   * downstream pipeline statuses (`llmStatus = PENDING`, `githubSyncStatus = PENDING`, `syncError = null`).
   */
  updateSubmissionCode(
    id: string,
    data: UpdateSubmissionCodeInput,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<Submission> {
    return tx.submission.update({
      where: { id },
      data: {
        code: data.code,
        codeHash: data.codeHash,
        language: data.language,
        runtime: data.runtime ?? null,
        memory: data.memory ?? null,
        externalSubmissionId: data.externalSubmissionId ?? null,
        llmStatus: LlmStatus.PENDING,
        githubSyncStatus: GithubSyncStatus.PENDING,
        syncError: null,
      },
    });
  }

  /**
   * Update `llmStatus` on a submission (e.g. PROCESSING or FAILED).
   */
  updateLlmStatus(
    id: string,
    llmStatus: LlmStatus,
    syncError?: string | null,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<Submission> {
    return tx.submission.update({
      where: { id },
      data: {
        llmStatus,
        ...(syncError !== undefined && { syncError }),
      },
    });
  }

  /**
   * Stage 1 Checkpoint: Atomically persists both `progress_events.ai_notes` and
   * `submissions.annotated_code` (+ complexities and `llmStatus = COMPLETED`) in a single transaction
   * BEFORE attempting the external GitHub API push.
   */
  async saveLlmCheckpoint(
    submissionId: string,
    userId: string,
    problemId: string,
    checkpoint: LlmCheckpointInput
  ): Promise<SubmissionWithRelations> {
    return prisma.$transaction(async (tx) => {
      await tx.progressEvent.update({
        where: {
          userId_problemId: {
            userId,
            problemId,
          },
        },
        data: {
          aiNotes: checkpoint.platformNotes,
        },
      });

      return tx.submission.update({
        where: { id: submissionId },
        data: {
          annotatedCode: checkpoint.annotatedCode,
          timeComplexity: checkpoint.timeComplexity,
          spaceComplexity: checkpoint.spaceComplexity,
          llmStatus: LlmStatus.COMPLETED,
          llmProcessedAt: new Date(),
        },
        include: {
          problem: true,
          progressEvent: true,
        },
      });
    });
  }

  /**
   * Update `githubSyncStatus` and optional `syncError` (e.g. SKIPPED, PROCESSING, FAILED).
   */
  updateGithubSyncStatus(
    id: string,
    githubSyncStatus: GithubSyncStatus,
    syncError: string | null = null,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<Submission> {
    return tx.submission.update({
      where: { id },
      data: {
        githubSyncStatus,
        syncError,
      },
    });
  }

  /**
   * Stage 2 Completion: Mark submission as `SYNCED` with GitHub repository and SHA metadata.
   */
  markGithubSynced(
    id: string,
    syncData: GithubSyncedInput,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<Submission> {
    return tx.submission.update({
      where: { id },
      data: {
        githubSyncStatus: GithubSyncStatus.SYNCED,
        githubRepo: syncData.githubRepo,
        githubFilePath: syncData.githubFilePath,
        githubFileSha: syncData.githubFileSha,
        githubCommitSha: syncData.githubCommitSha,
        githubSyncedAt: new Date(),
        syncError: null,
      },
    });
  }

  /**
   * Reset statuses for the Unified Retry Endpoint (`POST /api/v1/submissions/:problemId/retry-sync`).
   * If `resetLlm` is true, resets `llmStatus = PENDING` as well; otherwise preserves checkpointed LLM output.
   */
  resetForRetry(
    id: string,
    resetLlm: boolean,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<Submission> {
    return tx.submission.update({
      where: { id },
      data: {
        ...(resetLlm && { llmStatus: LlmStatus.PENDING }),
        githubSyncStatus: GithubSyncStatus.PENDING,
        syncError: null,
      },
    });
  }

  /**
   * List all submissions for a user ordered by most recently updated.
   */
  findSubmissionsByUser(userId: string): Promise<SubmissionWithRelations[]> {
    return prisma.submission.findMany({
      where: { userId },
      include: {
        problem: true,
        progressEvent: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

export { SubmissionRepository as submissionRepository };