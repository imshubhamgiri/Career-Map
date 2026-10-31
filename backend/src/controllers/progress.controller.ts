import { Request, Response, NextFunction } from 'express';
import { ProgressRepository } from '../repositories/progress.repository';
import { ApiResponse } from '../types';
import { ProgressEvent } from '@prisma/client';
import { UnauthorizedError, BadRequestError } from '../errors/appError';
import { UpdateProgressInput } from '../schemas/progress.schema';

export class ProgressController {
  constructor(private progressRepo: ProgressRepository = new ProgressRepository()) {}

  /**
   * POST /api/v1/progress/:problemId
   * Updates or toggles problem progress for the authenticated user
   */
  updateProgress = async (
    req: Request<{ problemId: string }, ApiResponse<ProgressEvent>, UpdateProgressInput>,
    res: Response<ApiResponse<ProgressEvent>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { problemId } = req.params;
      if (!problemId) {
        throw new BadRequestError('Problem ID is required');
      }

      const { status, aiNotes } = req.body;

      const progressEvent = await this.progressRepo.upsertProgressEvent({
        userId,
        problemId,
        status,
        aiNotes,
      });

      res.status(200).json({
        success: true,
        data: progressEvent,
      });
    } catch (err) {
      next(err);
    }
  };
}
