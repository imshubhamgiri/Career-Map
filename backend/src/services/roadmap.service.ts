import { Roadmap, RoadmapStatus } from '@prisma/client';
import { RoadmapRepository, RoadmapInput } from '../repositories/roadmap.repository';
import { ProblemService } from './problems.service';
import {logger} from '../utils/logger';
import { extractTextFromUrl } from './ingestion/dispatcher.service';
import { processDocumentPipeline } from './ingestion/pipeline.service';


let log = logger.child({ service: 'RoadmapService' });

export class RoadmapService {
  constructor(
    private roadmapRepo: RoadmapRepository = new RoadmapRepository(),
    private problemService: ProblemService = new ProblemService()
  ) {}

  /**
   * Create a new roadmap record
   */
  async createRoadmap(data: RoadmapInput): Promise<Roadmap> {
    return this.roadmapRepo.createRoadmap(data);
  }

  /**
   * Process a roadmap ingestion in the background
   */
  async processIngestion(roadmapId: string, url: string): Promise<void> {
    log.info({ roadmapId, url }, 'Starting background roadmap ingestion');
    try {
      // Step 1: Normalize & extract raw lines from URL (Google Sheet, Doc, or Web)
      const rawLines = await extractTextFromUrl(url);
      // Step 2: Sliding window chunking & LLM extraction
      const result = await processDocumentPipeline(rawLines);
      // Step 3: Quality gate check
      if (!result.success || result.data.length === 0) {
        const failureReason = !result.success ? result.message : 'No DSA problems detected in document';
        log.warn({ roadmapId, reason: failureReason }, 'Ingestion quality gate failed');
        await this.updateStatus(roadmapId, RoadmapStatus.FAILED, failureReason);
        return;
      }
      // Step 4: Batch deduplication & persist canonical problems + junction rows
      await this.problemService.saveExtractedProblems(roadmapId, result.data);
      // Step 5: Mark roadmap COMPLETED
      await this.updateStatus(roadmapId, RoadmapStatus.COMPLETED);
      log.info({ roadmapId, problemCount: result.data.length }, 'Background roadmap ingestion completed successfully');
    } catch (err: any) {
      log.error({ roadmapId, err: err.message }, 'Background roadmap ingestion encountered an unhandled error');
      await this.updateStatus(
        roadmapId,
        RoadmapStatus.FAILED,
        err.message || 'An unexpected error occurred during ingestion'
      ).catch(() => {});
    }
  }

  /**
   * Check if a roadmap already exists for a given source URL
   */
  async roadmapExists(url: string): Promise<Roadmap | null> {
    const roadmap = await this.roadmapRepo.findCompletedBySourceUrl(url);
    return roadmap;
  }

  /**
   * Retrieve a roadmap by ID along with its associated problems
   */
  async getRoadmapById(roadmapId: string, userId: string): Promise<Roadmap | null> {
    return this.roadmapRepo.findRoadmapById(roadmapId);
  }

  /**
   * List all roadmaps belonging to a specific user
   */
  async getUserRoadmaps(userId: string): Promise<Roadmap[]> {
    return this.roadmapRepo.findRoadmapsByUserId(userId);
  }

  /**
   * Delete a roadmap belonging to a specific user
   */
  async deleteRoadmap(roadmapId: string, userId: string): Promise<Roadmap> {
    return this.roadmapRepo.deleteRoadmap(roadmapId, userId);
  }

  /**
   * Check if a completed roadmap already exists for this sourceUrl (Clone-on-Ingest check)
   */
  async findCompletedBySourceUrl(sourceUrl: string): Promise<Roadmap | null> {
    return this.roadmapRepo.findCompletedBySourceUrl(sourceUrl);
  }

  /**
   * Clone an existing completed roadmap for a new user (Clone-on-Ingest optimization)
   */
  async cloneRoadmap(existingRoadmapId: string, newUserId: string, title?: string): Promise<Roadmap> {
    return this.roadmapRepo.cloneRoadmapWithProblems(existingRoadmapId, newUserId, title);
  }

  /**
   * Update lifecycle status of a roadmap (PENDING -> PROCESSING -> COMPLETED | FAILED)
   */
  async updateStatus(
    roadmapId: string,
    status: RoadmapStatus,
    errorMessage?: string
  ): Promise<Roadmap> {
    return this.roadmapRepo.updateRoadmapStatus(roadmapId, status, errorMessage);
  }

  /**
   * Execute ingestion pipeline asynchronously for a given roadmap
   */
  async processRoadmapIngestion(
    roadmapId: string,
    sourceUrl?: string,
    rawLines?: string[]
  ): Promise<void> {
    // Background worker orchestration
  }
}
