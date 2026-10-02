import { Request, Response, NextFunction } from 'express';
import { GithubConfigResponse, SettingsService, VerifyGithubConfigResult } from '../services/settings.service';
import {
  CreateApiKeySchema,
  UpsertGithubConfigInputDto,
  UpsertGithubConfigSchema,
  VerifyGithubConfigInputDto,
  VerifyGithubConfigSchema,
} from '../schemas/settings.schema';
import { BadRequestError, UnauthorizedError } from '../errors/appError';
import { ApiResponse } from '../types';

export class SettingsController {
  constructor(
    private settingsService: SettingsService = new SettingsService()
  ) {}

  /**
   * POST /api/v1/settings/api-keys
   * Generates a new API key for the authenticated user.
   */
  createApiKey = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const parsed = CreateApiKeySchema.safeParse(req.body || {});
      if (!parsed.success) {
        const message = parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        throw new BadRequestError(message || 'Invalid API key parameters');
      }

      const result = await this.settingsService.createApiKey(
        userId,
        parsed.data
      );

      res.status(201).json({
        success: true,
        message:
          'API key generated successfully. Copy this key now; it will not be shown again.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/settings/api-keys
   * Lists all API keys belonging to the authenticated user.
   */
  listApiKeys = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const keys = await this.settingsService.listApiKeys(userId);

      res.status(200).json({
        success: true,
        data: keys,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/settings/api-keys/:id
   * Revokes an existing API key.
   */
  revokeApiKey = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const apiKeyId = String(req.params.id || '').trim();
      if (!apiKeyId) {
        throw new BadRequestError('API key ID is required');
      }

      const result = await this.settingsService.revokeApiKey(userId, apiKeyId);

      res.status(200).json({
        success: true,
        message: 'API key revoked successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/settings/github
   * Retrieves GitHub integration settings.
   */
  getGithubConfig = async (
    req: Request,
    res: Response<ApiResponse<GithubConfigResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const config = await this.settingsService.getGithubConfig(userId);

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /api/v1/settings/github
   * Saves or updates GitHub repository settings with AES-256-GCM encrypted PAT.
   */
  updateGithubConfig = async (
    req: Request<{}, {}, UpsertGithubConfigInputDto>,
    res: Response<ApiResponse<GithubConfigResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const parsed = UpsertGithubConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        throw new BadRequestError(message || 'Invalid GitHub configuration');
      }

      const config = await this.settingsService.upsertGithubConfig(
        userId,
        parsed.data
      );

      res.status(200).json({
        success: true,
        message: 'GitHub configuration saved successfully',
        data: config,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/settings/github/verify
   * Verifies repository access and permissions against the GitHub API.
   */
  verifyGithubConfig = async (
    req: Request<{}, {}, VerifyGithubConfigInputDto>,
    res: Response<ApiResponse<VerifyGithubConfigResult>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const parsed = VerifyGithubConfigSchema.safeParse(req.body || {});
      if (!parsed.success) {
        const message = parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        throw new BadRequestError(message || 'Invalid verification parameters');
      }

      const result = await this.settingsService.verifyGithubConfig(
        userId,
        parsed.data
      );

      res.status(200).json({
        success: true,
        message: 'GitHub repository access verified successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}
