import prisma from '../config/db';
import { Problem, RoadmapProblem, Difficulty, Prisma } from '@prisma/client';

export interface CanonicalProblemInput {
  canonicalSlug: string;
  title: string;
  difficulty?: Difficulty;
  platform?: string;
  externalUrl?: string;
  platformProblemId?: string;
}

export interface RoadmapProblemInput {
  roadmapId: string;
  problemId: string;
  topic: string;
  originalTitle: string;
  originalUrl?: string;
  originalCategory?: string;
  originalDifficulty?: Difficulty;
  orderIndex?: number;
}

export class ProblemsRepository {
  /**
   * Batch query 1: Fetch existing canonical problems by an array of canonical slugs.
   * [PHASE 5 FIX]: Added optional `tx` transaction client parameter for atomic transactions.
   */
  async findProblemsByCanonicalSlugs(
    slugs: string[],
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<Pick<Problem, 'id' | 'canonicalSlug'>[]> {
    if (slugs.length === 0) return [];
    return tx.problem.findMany({
      where: {
        canonicalSlug: { in: slugs },
      },
      select: {
        id: true,
        canonicalSlug: true,
      },
    });
  }

  /**
   * Batch query 2: Create unmatched canonical problems and return their IDs.
   * [PHASE 5 FIX]: Added optional `tx` transaction client parameter for atomic transactions.
   */
  async createManyCanonicalProblems(
    data: CanonicalProblemInput[],
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<Pick<Problem, 'id' | 'canonicalSlug'>[]> {
    if (data.length === 0) return [];
    return tx.problem.createManyAndReturn({
      data,
      select: {
        id: true,
        canonicalSlug: true,
      },
    });
  }

  /**
   * Batch query 3: Bulk insert junction entries into roadmap_problems.
   * [PHASE 5 FIX]: Added optional `tx` transaction client parameter for atomic transactions.
   */
  async createRoadmapProblems(
    data: RoadmapProblemInput[],
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<{ count: number }> {
    if (data.length === 0) return { count: 0 };
    return tx.roadmapProblem.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Find a canonical problem by its unique slug.
   */
  async findProblemBySlug(canonicalSlug: string): Promise<Problem | null> {
    return prisma.problem.findUnique({
      where: { canonicalSlug },
    });
  }

  /**
   * Retrieve all problems belonging to a roadmap with canonical problem details.
   */
  async findRoadmapProblems(roadmapId: string): Promise<RoadmapProblem[]> {
    return prisma.roadmapProblem.findMany({
      where: { roadmapId },
      include: {
        problem: true,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });
  }
}