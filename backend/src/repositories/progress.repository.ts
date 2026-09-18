import prisma from '../config/db';
import { ProgressEvent, ProgressStatus, GithubSyncStatus } from '@prisma/client';

export interface ProgressEventInput {
  userId: string;
  problemId: string;
  status: ProgressStatus;
  notes?: string;
  githubSyncStatus?: GithubSyncStatus;
  githubRepo?: string;
  githubFilePath?: string;
}

export class ProgressRepository {
  createProgressEvent(data: ProgressEventInput): Promise<ProgressEvent> {
    return prisma.progressEvent.create({
      data,
    });
  }

  findProgressByUserAndProblem(userId: string, problemId: string): Promise<ProgressEvent[]> {
    return prisma.progressEvent.findMany({
      where: {
        userId,
        problemId,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });
  }

  findLatestProgressByUserAndProblem(userId: string, problemId: string): Promise<ProgressEvent | null> {
    return prisma.progressEvent.findFirst({
      where: {
        userId,
        problemId,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });
  }

  updateGithubSyncStatus(
    progressEventId: string,
    syncStatus: GithubSyncStatus,
    details?: { repo?: string; filePath?: string; syncedAt?: Date }
  ): Promise<ProgressEvent> {
    return prisma.progressEvent.update({
      where: { id: progressEventId },
      data: {
        githubSyncStatus: syncStatus,
        ...(details?.repo && { githubRepo: details.repo }),
        ...(details?.filePath && { githubFilePath: details.filePath }),
        ...(details?.syncedAt && { githubSyncedAt: details.syncedAt }),
      },
    });
  }
}
