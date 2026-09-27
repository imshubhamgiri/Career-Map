import prisma from '../config/db';
import { ProgressEvent, ProgressStatus, Prisma } from '@prisma/client';

export interface ProgressEventInput {
  userId: string;
  problemId: string;
  status?: ProgressStatus;
  aiNotes?: string | null;
  solvedAt?: Date | null;
}

export class ProgressRepository {
  /**
   * Upsert a user's progress on a canonical problem using the composite unique key (userId, problemId).
   */
  upsertProgressEvent(
    data: ProgressEventInput,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<ProgressEvent> {
    const status = data.status ?? ProgressStatus.SOLVED;
    const solvedAt =
      data.solvedAt !== undefined
        ? data.solvedAt
        : status === ProgressStatus.SOLVED
          ? new Date()
          : null;

    return tx.progressEvent.upsert({
      where: {
        userId_problemId: {
          userId: data.userId,
          problemId: data.problemId,
        },
      },
      create: {
        userId: data.userId,
        problemId: data.problemId,
        status,
        aiNotes: data.aiNotes ?? null,
        solvedAt,
      },
      update: {
        status,
        ...(data.aiNotes !== undefined && { aiNotes: data.aiNotes }),
        ...(solvedAt !== undefined && { solvedAt }),
      },
    });
  }

  /**
   * Create or upsert a progress event record.
   */
  createProgressEvent(
    data: ProgressEventInput,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<ProgressEvent> {
    return this.upsertProgressEvent(data, tx);
  }

  /**
   * Find the unique progress event for a (userId, problemId) pair, including its linked submission.
   */
  findProgressByUserAndProblem(
    userId: string,
    problemId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<ProgressEvent | null> {
    return tx.progressEvent.findUnique({
      where: {
        userId_problemId: {
          userId,
          problemId,
        },
      },
      include: {
        submission: true,
      },
    });
  }

  /**
   * Alias for fetching a user's progress record by composite unique key (userId, problemId).
   */
  findLatestProgressByUserAndProblem(
    userId: string,
    problemId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<ProgressEvent | null> {
    return this.findProgressByUserAndProblem(userId, problemId, tx);
  }

  /**
   * Persist AI-generated revision notes (`ai_notes`) during Stage 1 of githubSyncWorker.
   */
  updateAiNotes(
    userId: string,
    problemId: string,
    aiNotes: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<ProgressEvent> {
    return tx.progressEvent.update({
      where: {
        userId_problemId: {
          userId,
          problemId,
        },
      },
      data: {
        aiNotes,
      },
    });
  }

  /**
   * Update progress status for a (userId, problemId) pair.
   */
  updateProgressStatus(
    userId: string,
    problemId: string,
    status: ProgressStatus,
    solvedAt?: Date | null,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<ProgressEvent> {
    return tx.progressEvent.update({
      where: {
        userId_problemId: {
          userId,
          problemId,
        },
      },
      data: {
        status,
        ...(solvedAt !== undefined && { solvedAt }),
      },
    });
  }
}
