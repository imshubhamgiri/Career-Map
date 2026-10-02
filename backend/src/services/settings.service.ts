import crypto from 'crypto';
import { ApiKeyRepository } from '../repositories/apiKey.repository';
import { GithubConfigRepository } from '../repositories/githubConfig.repository';
import { encryptSecret, decryptSecret, hashApiKey } from '../utils/crypto';
import {
  CreateApiKeyInputDto,
  UpsertGithubConfigInputDto,
  VerifyGithubConfigInputDto,
} from '../schemas/settings.schema';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/appError';
import { logger } from '../utils/logger';

const log = logger.child({ service: 'SettingsService' });

export interface ApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
}

export interface CreateApiKeyResult {
  apiKey: ApiKeyResponse;
  rawKey: string;
}

export interface GithubConfigResponse {
  isConfigured: boolean;
  githubUsername?: string;
  githubRepo?: string;
  githubBranch?: string;
  lastSyncedAt?: Date | null;
  updatedAt?: Date;
}

export interface VerifyGithubConfigResult {
  valid: boolean;
  repository: string;
  defaultBranch: string;
  isPrivate: boolean;
  hasPushAccess: boolean;
}

export class SettingsService {
  constructor(
    private apiKeyRepo: ApiKeyRepository = new ApiKeyRepository(),
    private githubConfigRepo: GithubConfigRepository = new GithubConfigRepository()
  ) {}

  // =========================================================================
  // API KEY MANAGEMENT
  // =========================================================================

  /**
   * Generates a new cryptographically secure API key for `cos-leet` Chrome Extension.
   * Format: `cos_live_<48 hex chars>`
   * Stores SHA-256 hash in database; returns the raw key ONCE to the user.
   */
  async createApiKey(
    userId: string,
    input: CreateApiKeyInputDto
  ): Promise<CreateApiKeyResult> {
    const rawRandom = crypto.randomBytes(24).toString('hex');
    const rawKey = `cos_live_${rawRandom}`;
    const keyPrefix = `cos_live_${rawRandom.slice(0, 6)}...`;
    const keyHash = hashApiKey(rawKey);

    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = await this.apiKeyRepo.createApiKey({
      userId,
      name: input.name,
      keyHash,
      keyPrefix,
      expiresAt,
    });

    log.info(
      { userId, apiKeyId: apiKey.id, keyPrefix },
      'Generated new API key for user'
    );

    return {
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      rawKey,
    };
  }

  /**
   * Lists all API keys belonging to a user, with sensitive key hashes omitted.
   */
  async listApiKeys(userId: string): Promise<ApiKeyResponse[]> {
    const keys = await this.apiKeyRepo.findAllByUserId(userId);
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      revokedAt: k.revokedAt,
      createdAt: k.createdAt,
    }));
  }

  /**
   * Soft-revokes an API key owned by the user.
   */
  async revokeApiKey(
    userId: string,
    apiKeyId: string
  ): Promise<{ id: string; revokedAt: Date | null }> {
    const key = await this.apiKeyRepo.findUserKeyById(apiKeyId, userId);
    if (!key) {
      throw new NotFoundError('API key not found');
    }

    if (key.revokedAt) {
      return { id: key.id, revokedAt: key.revokedAt };
    }

    const updated = await this.apiKeyRepo.revokeApiKey(apiKeyId);
    log.info({ userId, apiKeyId }, 'Revoked API key');

    return { id: updated.id, revokedAt: updated.revokedAt };
  }

  // =========================================================================
  // GITHUB CONFIG MANAGEMENT
  // =========================================================================

  /**
   * Retrieves the current GitHub configuration status for a user.
   * Plaintext and encrypted tokens are strictly omitted from the response.
   */
  async getGithubConfig(userId: string): Promise<GithubConfigResponse> {
    const config = await this.githubConfigRepo.findByUserId(userId);
    if (!config) {
      return { isConfigured: false };
    }

    return {
      isConfigured: config.isConfigured,
      githubUsername: config.githubUsername,
      githubRepo: config.githubRepo,
      githubBranch: config.githubBranch,
      lastSyncedAt: config.lastSyncedAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Saves or updates a user's GitHub repository configuration, encrypting
   * the Personal Access Token with AES-256-GCM before database persistence.
   */
  async upsertGithubConfig(
    userId: string,
    input: UpsertGithubConfigInputDto
  ): Promise<GithubConfigResponse> {
    const accessTokenEncrypted = encryptSecret(input.personalAccessToken);

    const config = await this.githubConfigRepo.upsertGithubConfig({
      userId,
      githubUsername: input.githubUsername,
      githubRepo: input.githubRepo,
      githubBranch: input.githubBranch,
      accessTokenEncrypted,
      isConfigured: true,
    });

    log.info(
      { userId, repo: `${config.githubUsername}/${config.githubRepo}` },
      'Updated GitHub configuration for user'
    );

    return {
      isConfigured: config.isConfigured,
      githubUsername: config.githubUsername,
      githubRepo: config.githubRepo,
      githubBranch: config.githubBranch,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Verifies access to the target GitHub repository and confirms write (push) permissions.
   * Can verify either newly supplied (unsaved) inputs or previously saved credentials.
   */
  async verifyGithubConfig(
    userId: string,
    input?: VerifyGithubConfigInputDto
  ): Promise<VerifyGithubConfigResult> {
    let pat = input?.personalAccessToken?.trim();
    let username = input?.githubUsername?.trim();
    let repo = input?.githubRepo?.trim();

    if (!pat || !username || !repo) {
      const saved = await this.githubConfigRepo.findByUserId(userId);
      if (!saved || !saved.isConfigured) {
        throw new BadRequestError(
          'No saved GitHub configuration found. Please provide repository and token details.'
        );
      }
      username = username || saved.githubUsername;
      repo = repo || saved.githubRepo;
      if (!pat) {
        try {
          pat = decryptSecret(saved.accessTokenEncrypted);
        } catch {
          throw new BadRequestError(
            'Failed to decrypt saved GitHub Personal Access Token'
          );
        }
      }
    }

    const url = `https://api.github.com/repos/${username}/${repo}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Career-OS',
      },
    });

    if (response.status === 401) {
      throw new UnauthorizedError(
        'Invalid GitHub Personal Access Token or token has expired'
      );
    }
    if (response.status === 404) {
      throw new NotFoundError(
        `Repository "${username}/${repo}" not found or token lacks access`
      );
    }
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new BadRequestError(
        `GitHub verification failed: ${errText || response.statusText}`
      );
    }

    const data = (await response.json()) as any;
    const hasPushAccess = data.permissions ? Boolean(data.permissions.push) : true;
    if (data.permissions && !data.permissions.push) {
      throw new BadRequestError(
        'Personal Access Token lacks write (push) permission to this repository.'
      );
    }

    return {
      valid: true,
      repository: data.full_name,
      defaultBranch: data.default_branch || 'main',
      isPrivate: Boolean(data.private),
      hasPushAccess,
    };
  }
}
