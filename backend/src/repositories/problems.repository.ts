import prisma from '../config/db';
import { Problem, RoadmapProblem, Difficulty } from '@prisma/client';

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
   */
  async findProblemsByCanonicalSlugs(slugs: string[]): Promise<Pick<Problem, 'id' | 'canonicalSlug'>[]> {
    if (slugs.length === 0) return [];
    return prisma.problem.findMany({
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
   */
  async createManyCanonicalProblems(data: CanonicalProblemInput[]): Promise<Pick<Problem, 'id' | 'canonicalSlug'>[]> {
    if (data.length === 0) return [];
    return prisma.problem.createManyAndReturn({
      data,
      select: {
        id: true,
        canonicalSlug: true,
      },
    });
  }

  /**
   * Batch query 3: Bulk insert junction entries into roadmap_problems.
   */
  async createRoadmapProblems(data: RoadmapProblemInput[]): Promise<{ count: number }> {
    if (data.length === 0) return { count: 0 };
    return prisma.roadmapProblem.createMany({
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