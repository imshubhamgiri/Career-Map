import { Difficulty, Problem } from '@prisma/client';
import { z } from 'zod';
import { ProblemsRepository, ProblemInput } from '../repositories/problems.repository';
import { ExtractedQuestionSchema } from '../schemas/problem.schema';

type ExtractedQuestionInput = z.infer<typeof ExtractedQuestionSchema>;

// 🗺️ Dictionary to translate PascalCase text into your Prisma DB Enum format
const difficultyMapper: Record<ExtractedQuestionInput['difficulty'], Difficulty> = {
  'Easy': Difficulty.EASY,
  'Medium': Difficulty.MEDIUM,
  'Hard': Difficulty.HARD,
  'Unknown': Difficulty.UNKNOWN,
};

export class ProblemService {
  private problemRepo = new ProblemsRepository();

  private toCanonicalSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async saveExtractedProblem(roadmapId: string, extractedData: ExtractedQuestionInput): Promise<Problem> {
    // ⚙️ Map extraction metadata to match your unified Problem table fields
    const problemInput: ProblemInput = {
      roadmapId,
      title: extractedData.title.trim(),
      topic: extractedData.category.trim(), // maps 'category' -> 'topic'
      difficulty: difficultyMapper[extractedData.difficulty] ?? Difficulty.UNKNOWN, // maps 'Easy' -> 'EASY'
      externalUrl: extractedData.url?.trim() || undefined, // sets empty strings to undefined
      canonicalSlug: this.toCanonicalSlug(extractedData.title),
    };

    return this.problemRepo.createProblem(problemInput);
  }

  /**
   * Bulk persists an array of extracted questions in a single optimal database operation.
   * Uses repository's batch insertion (INSERT INTO ... VALUES ... RETURNING *) for O(1) DB round-trips.
   */
  async saveExtractedProblems(roadmapId: string, extractedData: ExtractedQuestionInput[]): Promise<Problem[]> {
    if (!extractedData || extractedData.length === 0) {
      return [];
    }

    const problemInputs: ProblemInput[] = extractedData.map((item) => ({
      roadmapId,
      title: item.title.trim(),
      topic: item.category.trim(),
      difficulty: difficultyMapper[item.difficulty] ?? Difficulty.UNKNOWN,
      externalUrl: item.url?.trim() || undefined,
      canonicalSlug: this.toCanonicalSlug(item.title),
    }));

    return this.problemRepo.createManyProblems(problemInputs);
  }
}
