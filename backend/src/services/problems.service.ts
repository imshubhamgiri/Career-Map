import { Difficulty } from '@prisma/client';
import { z } from 'zod';
import { ProblemsRepository, CanonicalProblemInput, RoadmapProblemInput } from '../repositories/problems.repository';
import { ExtractedQuestionSchema } from '../schemas/problem.schema';
import { resolveCanonicalSlug } from '../utils/canonicalSlug';

type ExtractedQuestionInput = z.infer<typeof ExtractedQuestionSchema>;

// Dictionary to translate extracted text difficulty to Prisma Enum format
const difficultyMapper: Record<ExtractedQuestionInput['difficulty'], Difficulty> = {
  Easy: Difficulty.EASY,
  Medium: Difficulty.MEDIUM,
  Hard: Difficulty.HARD,
  Unknown: Difficulty.UNKNOWN,
};

export class ProblemService {
  constructor(private problemRepo: ProblemsRepository = new ProblemsRepository()) {}

  /**
   * Bulk persists extracted problems using Identity Resolution and Batch Matching:
   * 1. Resolves universal canonical slugs in memory.
   * 2. Queries DB once for existing problems: WHERE canonical_slug IN (...).
   * 3. Partitions matched vs unmatched: inserts unmatched in bulk.
   * 4. Bulk inserts all items into roadmap_problems junction table.
   */
  async saveExtractedProblems(roadmapId: string, extractedData: ExtractedQuestionInput[]): Promise<void> {
    if (!extractedData || extractedData.length === 0) {
      return;
    }

    // Step 1: In-memory identity resolution & canonical slug extraction
    const itemsWithSlugs = extractedData.map((item, idx) => ({
      ...item,
      canonicalSlug: resolveCanonicalSlug(item.title, item.url),
      orderIndex: idx,
    }));

    const incomingSlugs = Array.from(new Set(itemsWithSlugs.map((item) => item.canonicalSlug)));

    // Step 2: Batch Query 1 - Find which canonical problems already exist
    const existingProblems = await this.problemRepo.findProblemsByCanonicalSlugs(incomingSlugs);

    // Build fast O(1) lookup map: canonicalSlug -> problemId
    const slugToIdMap = new Map<string, string>();
    for (const ep of existingProblems) {
      slugToIdMap.set(ep.canonicalSlug, ep.id);
    }

    // Step 3: Identify unmatched items that need creation
    const unmatchedSlugs = incomingSlugs.filter((slug) => !slugToIdMap.has(slug));
    if (unmatchedSlugs.length > 0) {
      // Find first occurrence of each unmatched slug to form canonical problem data
      const newCanonicalProblems: CanonicalProblemInput[] = unmatchedSlugs.map((slug) => {
        const sourceItem = itemsWithSlugs.find((item) => item.canonicalSlug === slug)!;
        return {
          canonicalSlug: slug,
          title: sourceItem.title.trim(),
          difficulty: difficultyMapper[sourceItem.difficulty] ?? Difficulty.UNKNOWN,
          platform: sourceItem.platform,
          externalUrl: sourceItem.url?.trim() || undefined,
        };
      });

      // Batch Query 2 - Create new canonical problems and retrieve generated IDs
      const newlyCreated = await this.problemRepo.createManyCanonicalProblems(newCanonicalProblems);
      for (const np of newlyCreated) {
        slugToIdMap.set(np.canonicalSlug, np.id);
      }
    }

    // Step 4: Batch Query 3 - Bulk insert junction entries into roadmap_problems
    const roadmapProblemsData: RoadmapProblemInput[] = itemsWithSlugs.map((item) => ({
      roadmapId,
      problemId: slugToIdMap.get(item.canonicalSlug)!,
      topic: item.category?.trim() || 'General',
      originalTitle: item.title.trim(),
      originalUrl: item.url?.trim() || undefined,
      originalCategory: item.category?.trim() || undefined,
      originalDifficulty: difficultyMapper[item.difficulty] ?? Difficulty.UNKNOWN,
      orderIndex: item.orderIndex,
    }));

    await this.problemRepo.createRoadmapProblems(roadmapProblemsData);
  }
}
