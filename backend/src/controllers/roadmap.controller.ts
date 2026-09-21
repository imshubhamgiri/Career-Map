import { Request, Response, NextFunction } from 'express';
import { RoadmapService } from '../services/roadmap.service';
import { ApiResponse, CreateRoadmapInput } from '../types';
import { Roadmap } from '@prisma/client';

export class RoadmapController {
  constructor(private roadmapService: RoadmapService = new RoadmapService()) {}

  /**
   * POST /api/v1/roadmaps
   * Create a new roadmap
   */
  createRoadmap = async (
    req: Request<{}, ApiResponse<Roadmap>, CreateRoadmapInput>,
    res: Response<ApiResponse<Roadmap>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const roadmap = await this.roadmapService.createRoadmap({
        ...req.body,
        userId: userId!,
      });
      res.status(201).json({ success: true, data: roadmap });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/roadmaps
   * List all roadmaps for the logged-in user
   */
  getUserRoadmaps = async (
    req: Request<{}, ApiResponse<Roadmap[]>, never>,
    res: Response<ApiResponse<Roadmap[]>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const roadmaps = await this.roadmapService.getUserRoadmaps(userId!);
      res.status(200).json({ success: true, data: roadmaps });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/roadmaps/:id
   * Get roadmap details with problems
   */
  getRoadmapById = async (
    req: Request<{ id: string }, ApiResponse<Roadmap | null>, never>,
    res: Response<ApiResponse<Roadmap | null>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;
      const userId = req.user?.userId;
      const roadmap = await this.roadmapService.getRoadmapById(id, userId!);
      res.status(200).json({ success: true, data: roadmap });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/roadmaps/:id
   * Delete a roadmap
   */
  deleteRoadmap = async (
    req: Request<{ id: string }, ApiResponse<Roadmap>, never>,
    res: Response<ApiResponse<Roadmap>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;
      const userId = req.user?.userId;
      const deleted = await this.roadmapService.deleteRoadmap(id, userId!);
      res.status(200).json({ success: true, data: deleted });
    } catch (err) {
      next(err);
    }
  };
}
