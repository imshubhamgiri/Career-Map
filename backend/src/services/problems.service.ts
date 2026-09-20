import prisma from '../config/db';
import { Difficulty } from '@prisma/client';
import { z } from 'zod';
import { ProblemsRepository, CanonicalProblemInput, RoadmapProblemInput } from '../repositories/problems.repository';
import { ExtractedQuestionSchema } from '../schemas/problem.schema';
import { resolveCanonicalSlug } from '../utils/canonicalSlug';
import { logger } from '../utils/logger';

let log = logger.child({ service: 'ProblemService' });

export type ExtractedQuestionInput = z.infer<typeof ExtractedQuestionSchema>;

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
   * 2. Deduplicates incoming problems by canonicalSlug for this roadmap batch.
   * 3. Executes DB operations within an atomic prisma.$transaction:
   *    - Queries existing problems: WHERE canonical_slug IN (...).
   *    - Partitions matched vs unmatched: inserts unmatched in bulk.
   *    - Bulk inserts unique junction entries into roadmap_problems.
   */
  async saveExtractedProblems(roadmapId: string, extractedData: ExtractedQuestionInput[]): Promise<void> {
    if (!extractedData || extractedData.length === 0) {
      log.warn({ roadmapId }, 'No extracted problems to save for this roadmap ingestion');
      return;
    }
    
    log.info({ roadmapId, count: extractedData.length }, 'Saving extracted problems for roadmap ingestion');
    // Step 1: In-memory identity resolution & canonical slug extraction
    const itemsWithSlugs = extractedData.map((item, idx) => ({
      ...item,
      canonicalSlug: resolveCanonicalSlug(item.title, item.url),
      orderIndex: idx,
    }));

    // [PHASE 5 FIX]: Deduplicate by canonicalSlug within the roadmap batch.
    // A single roadmap cannot link to the same canonical problem multiple times
    // (enforced by @@unique([roadmapId, problemId])).
    // Without this, duplicate problems in the sheet produce duplicate (roadmapId, problemId)
    // rows in the same batch, causing PostgreSQL to fail with fatal error:
    // ERROR: 21000: ON CONFLICT DO NOTHING cannot affect row a second time
    const seenSlugs = new Set<string>();
    const uniqueItemsForRoadmap: typeof itemsWithSlugs = [];

    for (const item of itemsWithSlugs) {
      if (!seenSlugs.has(item.canonicalSlug)) {
        seenSlugs.add(item.canonicalSlug);
        uniqueItemsForRoadmap.push(item);
      }
    }

    const incomingSlugs = Array.from(seenSlugs);

    // [PHASE 5 FIX]: Wrap DB operations in an atomic transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Step 2: Batch Query 1 - Find which canonical problems already exist
      log.info({ roadmapId, incomingSlugsCount: incomingSlugs.length }, 'Checking for existing canonical problems');
      const existingProblems = await this.problemRepo.findProblemsByCanonicalSlugs(incomingSlugs, tx);

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
          const sourceItem = uniqueItemsForRoadmap.find((item) => item.canonicalSlug === slug)!;
          return {
            canonicalSlug: slug,
            title: sourceItem.title.trim(),
            difficulty: difficultyMapper[sourceItem.difficulty] ?? Difficulty.UNKNOWN,
            platform: sourceItem.platform,
            externalUrl: sourceItem.url?.trim() || undefined,
          };
        });

        log.info({ roadmapId, newCanonicalCount: newCanonicalProblems.length }, 'Creating new canonical problems');

        // Batch Query 2 - Create new canonical problems and retrieve generated IDs
        const newlyCreated = await this.problemRepo.createManyCanonicalProblems(newCanonicalProblems, tx);
        for (const np of newlyCreated) {
          slugToIdMap.set(np.canonicalSlug, np.id);
        }
      }

      log.info({ roadmapId, totalUniqueProblems: slugToIdMap.size }, 'Total unique canonical problems resolved for roadmap');

      // Step 4: Batch Query 3 - Bulk insert junction entries into roadmap_problems
      // [PHASE 5 FIX]: Map over uniqueItemsForRoadmap so every (roadmapId, problemId) pair is guaranteed unique
      const roadmapProblemsData: RoadmapProblemInput[] = uniqueItemsForRoadmap.map((item) => ({
        roadmapId,
        problemId: slugToIdMap.get(item.canonicalSlug)!,
        topic: item.category?.trim() || 'General',
        originalTitle: item.title.trim(),
        originalUrl: item.url?.trim() || undefined,
        originalCategory: item.category?.trim() || undefined,
        originalDifficulty: difficultyMapper[item.difficulty] ?? Difficulty.UNKNOWN,
        orderIndex: item.orderIndex,
      }));

      log.info({ roadmapId, junctionInsertCount: roadmapProblemsData.length }, 'Inserting roadmap_problems junction entries');

      await this.problemRepo.createRoadmapProblems(roadmapProblemsData, tx);
    });
  }
}
