import prisma from '../config/db';
import { Roadmap, RoadmapStatus } from '@prisma/client';

export interface RoadmapInput {
  userId: string;
  title: string;
  sourceType: string;
  sourceUrl?: string;
  status?: RoadmapStatus;
  errorMessage?: string;
}

export class RoadmapRepository {
  createRoadmap(data: RoadmapInput): Promise<Roadmap> {
    return prisma.roadmap.create({ data });
  }

  updateRoadmapStatus(
    roadmapId: string,
    status: RoadmapStatus,
    errorMessage?: string
  ): Promise<Roadmap> {
    return prisma.roadmap.update({
      where: { id: roadmapId },
      data: {
        status,
        ...(errorMessage !== undefined && { errorMessage }),
      },
    });
  }

  findRoadmapById(id: string): Promise<Roadmap | null> {
    return prisma.roadmap.findUnique({
      where: { id },
      include: {
        roadmapProblems: {
          include: {
            problem: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
  }

  findRoadmapsByUserId(userId: string): Promise<Roadmap[]> {
    return prisma.roadmap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findCompletedBySourceUrl(sourceUrl: string): Promise<Roadmap | null> {
    return prisma.roadmap.findFirst({
      where: {
        sourceUrl,
        status: RoadmapStatus.COMPLETED,
      },
      include: {
        roadmapProblems: {
          include: {
            problem: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
  }

  deleteRoadmap(id: string, userId: string): Promise<Roadmap> {
    return prisma.roadmap.delete({
      where: {
        id,
        userId,
      },
    });
  }

  /**
   * Clone-on-Ingest optimization: Atomically clones an existing roadmap and its roadmap_problems
   * linkages for a new user without touching LLMs or scraping.
   */
  async cloneRoadmapWithProblems(
    sourceRoadmapId: string,
    newUserId: string,
    customTitle?: string
  ): Promise<Roadmap> {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch source roadmap with problems
      const source = await tx.roadmap.findUniqueOrThrow({
        where: { id: sourceRoadmapId },
        include: {
          roadmapProblems: true,
        },
      });

      // 2. Create cloned roadmap for the new user
      const clonedRoadmap = await tx.roadmap.create({
        data: {
          userId: newUserId,
          title: customTitle || source.title,
          sourceType: source.sourceType,
          sourceUrl: source.sourceUrl,
          status: RoadmapStatus.COMPLETED,
        },
      });

      // 3. Batch clone roadmap_problems referencing the exact same canonical problem IDs
      if (source.roadmapProblems.length > 0) {
        const clonedProblemsData = source.roadmapProblems.map((rp) => ({
          roadmapId: clonedRoadmap.id,
          problemId: rp.problemId,
          topic: rp.topic,
          originalTitle: rp.originalTitle,
          originalUrl: rp.originalUrl,
          originalCategory: rp.originalCategory,
          originalDifficulty: rp.originalDifficulty,
          orderIndex: rp.orderIndex,
        }));

        await tx.roadmapProblem.createMany({
          data: clonedProblemsData,
        });
      }

      return clonedRoadmap;
    });
  }
}