import { Request, Response, NextFunction } from 'express';
import { SubmissionService } from '../services/submission.service';
import { CreateSubmissionSchema } from '../schemas/submission.schema';
import { BadRequestError, UnauthorizedError } from '../errors/appError';

export class SubmissionController {
  constructor(
    private submissionService: SubmissionService = new SubmissionService()
  ) {}

  /**
   * POST /api/v1/submissions
   * Authenticated via `verifyApiKey` middleware (`x-api-key`).
   * Validates submission payload, deduplicates via 15s Redis lock, and enqueues `submissionQueue`.
   */
  handleSubmission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User context missing from API key');
      }

      const parsed = CreateSubmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        throw new BadRequestError(message || 'Invalid submission payload');
      }

      const result = await this.submissionService.ingestSubmission(
        userId,
        parsed.data
      );

      res.status(202).json({
        success: true,
        status: result.status,
        message: result.message,
        data: {
          slug: result.slug,
          codeHash: result.codeHash,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/submissions/:problemId/retry-sync
   * Authenticated via standard session JWT (`authenticate` middleware).
   * Unified retry endpoint handling all 3 skip/failure modes automatically.
   */
  retrySync = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const problemId = String(req.params.problemId || '').trim();
      if (!problemId) {
        throw new BadRequestError('problemId parameter is required');
      }

      const result = await this.submissionService.retrySubmissionSync(
        userId,
        problemId
      );

      res.status(202).json({
        success: true,
        status: result.status,
        message: 'GitHub synchronization queued',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/submissions
   * Lists all submissions for the authenticated user.
   */
  listUserSubmissions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const submissions = await this.submissionService.getUserSubmissions(userId);
      res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (err) {
      next(err);
    }
  };
}