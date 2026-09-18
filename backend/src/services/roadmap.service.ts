import { Roadmap, RoadmapStatus } from '@prisma/client';
import { RoadmapRepository, RoadmapInput } from '../repositories/roadmap.repository';
import { ProblemService } from './problems.service';

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
   * Check if a roadmap already exists for a given source URL
   */
  async roadmapExists(url: string): Promise<string | null> {
    const roadmap = await this.roadmapRepo.findCompletedBySourceUrl(url);
    return roadmap ? roadmap.id : null;
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
