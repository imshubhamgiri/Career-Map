import prisma from '../config/db';
import { Problem, Difficulty } from '@prisma/client';

export interface ProblemInput {
  roadmapId: string;
  title: string;
  topic: string;
  difficulty?: Difficulty;
  externalUrl?: string;
  canonicalSlug?: string;
}

export class ProblemsRepository {
  createProblem(data: ProblemInput): Promise<Problem> {
    return prisma.problem.create({
      data
    });
  }

  createManyProblems(data: ProblemInput[]): Promise<Problem[]> {
    if (data.length === 0) {
      return Promise.resolve([]);
    }
    return prisma.problem.createManyAndReturn({
      data
    });
  }
}