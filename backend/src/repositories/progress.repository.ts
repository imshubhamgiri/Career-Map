import prisma from '../config/db';
import { ProgressEvent, ProgressStatus } from '@prisma/client';

export interface ProgressEventInput {
  userId: string;
  problemId: string;
  status: ProgressStatus;
  notes?: string;
}

export class ProgressRepository {
  createProgressEvent(data: ProgressEventInput): Promise<ProgressEvent> {
    return prisma.progressEvent.create({
      data
    });
  }

  findProgressByUserAndProblem(userId: string, problemId: string): Promise<ProgressEvent[]> {
    return prisma.progressEvent.findMany({
      where: {
        userId,
        problemId
      },
      orderBy: {
        completedAt: 'desc'
      }
    });
  }

  findLatestProgressByUserAndProblem(userId: string, problemId: string): Promise<ProgressEvent | null> {
    return prisma.progressEvent.findFirst({
      where: {
        userId,
        problemId
      },
      orderBy: {
        completedAt: 'desc'
      }
    });
  }
}

