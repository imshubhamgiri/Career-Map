import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsService } from '../services/settings.service';
import { hashApiKey, decryptSecret, encryptSecret } from '../utils/crypto';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/appError';

describe('SettingsService (Phase 2: API Keys & GitHub Settings)', () => {
  const mockApiKeyRepo = {
    createApiKey: vi.fn(),
    findAllByUserId: vi.fn(),
    findUserKeyById: vi.fn(),
    revokeApiKey: vi.fn(),
  };

  const mockGithubConfigRepo = {
    findByUserId: vi.fn(),
    findActiveByUserId: vi.fn(),
    upsertGithubConfig: vi.fn(),
  };

  let service: SettingsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SettingsService(
      mockApiKeyRepo as any,
      mockGithubConfigRepo as any
    );
  });

  describe('API Key Management', () => {
    it('generates a new cos_live_ key, returns raw key once, and stores SHA-256 hash', async () => {
      mockApiKeyRepo.createApiKey.mockImplementation(async (input: any) => ({
        id: 'key-uuid-1',
        userId: input.userId,
        name: input.name,
        keyHash: input.keyHash,
        keyPrefix: input.keyPrefix,
        expiresAt: input.expiresAt,
        createdAt: new Date('2026-10-02T12:00:00Z'),
      }));

      const result = await service.createApiKey('user-1', {
        name: 'Work Laptop Extension',
        expiresInDays: 30,
      });

      expect(result.rawKey).toMatch(/^cos_live_[a-f0-9]{48}$/);
      expect(result.apiKey.keyPrefix).toMatch(/^cos_live_[a-f0-9]{6}\.\.\.$/);
      expect(result.apiKey.name).toBe('Work Laptop Extension');
      expect(result.apiKey.id).toBe('key-uuid-1');

      // Verify the hashed key was stored in the repository
      expect(mockApiKeyRepo.createApiKey).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'Work Laptop Extension',
        keyHash: hashApiKey(result.rawKey),
        keyPrefix: result.apiKey.keyPrefix,
        expiresAt: expect.any(Date),
      });
    });

    it('lists all API keys for user while omitting keyHash', async () => {
      mockApiKeyRepo.findAllByUserId.mockResolvedValue([
        {
          id: 'key-uuid-1',
          name: 'cos-leet Extension',
          keyPrefix: 'cos_live_a1b2c3...',
          keyHash: 'secret-hash-not-to-leak',
          lastUsedAt: new Date('2026-10-02T13:00:00Z'),
          expiresAt: null,
          revokedAt: null,
          createdAt: new Date('2026-10-01T10:00:00Z'),
        },
      ]);

      const keys = await service.listApiKeys('user-1');

      expect(keys).toHaveLength(1);
      expect(keys[0].id).toBe('key-uuid-1');
      expect(keys[0].keyPrefix).toBe('cos_live_a1b2c3...');
      expect((keys[0] as any).keyHash).toBeUndefined();
    });

    it('throws NotFoundError when trying to revoke a non-existent or foreign key', async () => {
      mockApiKeyRepo.findUserKeyById.mockResolvedValue(null);

      await expect(
        service.revokeApiKey('user-1', 'foreign-or-missing-key')
      ).rejects.toThrow(NotFoundError);

      expect(mockApiKeyRepo.revokeApiKey).not.toHaveBeenCalled();
    });

    it('revokes an existing user API key successfully', async () => {
      const revokedAt = new Date();
      mockApiKeyRepo.findUserKeyById.mockResolvedValue({
        id: 'key-uuid-1',
        userId: 'user-1',
        revokedAt: null,
      });
      mockApiKeyRepo.revokeApiKey.mockResolvedValue({
        id: 'key-uuid-1',
        revokedAt,
      });

      const res = await service.revokeApiKey('user-1', 'key-uuid-1');

      expect(res.id).toBe('key-uuid-1');
      expect(res.revokedAt).toEqual(revokedAt);
      expect(mockApiKeyRepo.revokeApiKey).toHaveBeenCalledWith('key-uuid-1');
    });
  });

  describe('GitHub Configuration Management', () => {
    it('returns isConfigured: false when no configuration exists', async () => {
      mockGithubConfigRepo.findByUserId.mockResolvedValue(null);

      const config = await service.getGithubConfig('user-1');
      expect(config.isConfigured).toBe(false);
      expect(config.githubUsername).toBeUndefined();
    });

    it('returns sanitized GitHub configuration without exposing encrypted PAT', async () => {
      mockGithubConfigRepo.findByUserId.mockResolvedValue({
        id: 'cfg-1',
        userId: 'user-1',
        githubUsername: 'octocat',
        githubRepo: 'dsa-roadmaps',
        githubBranch: 'main',
        accessTokenEncrypted: 'iv:tag:secret',
        isConfigured: true,
        lastSyncedAt: new Date('2026-10-02T10:00:00Z'),
        updatedAt: new Date('2026-10-02T09:00:00Z'),
      });

      const config = await service.getGithubConfig('user-1');
      expect(config.isConfigured).toBe(true);
      expect(config.githubUsername).toBe('octocat');
      expect(config.githubRepo).toBe('dsa-roadmaps');
      expect((config as any).accessTokenEncrypted).toBeUndefined();
    });

    it('encrypts personal access token before persisting in database', async () => {
      const pat = 'ghp_superSecretToken1234567890';
      mockGithubConfigRepo.upsertGithubConfig.mockImplementation(
        async (data: any) => ({
          ...data,
          updatedAt: new Date(),
        })
      );

      const res = await service.upsertGithubConfig('user-1', {
        githubUsername: 'octocat',
        githubRepo: 'dsa-roadmaps',
        personalAccessToken: pat,
      });

      expect(res.isConfigured).toBe(true);
      expect(res.githubUsername).toBe('octocat');

      const callArgs = mockGithubConfigRepo.upsertGithubConfig.mock.calls[0][0];
      expect(callArgs.accessTokenEncrypted).not.toContain(pat);
      expect(decryptSecret(callArgs.accessTokenEncrypted)).toBe(pat);
    });

    it('verifies valid GitHub repository and confirms push permissions', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          full_name: 'octocat/dsa-roadmaps',
          default_branch: 'main',
          private: true,
          permissions: { push: true, pull: true },
        }),
      } as Response);

      const res = await service.verifyGithubConfig('user-1', {
        githubUsername: 'octocat',
        githubRepo: 'dsa-roadmaps',
        personalAccessToken: 'ghp_validToken12345',
      });

      expect(res.valid).toBe(true);
      expect(res.repository).toBe('octocat/dsa-roadmaps');
      expect(res.hasPushAccess).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.github.com/repos/octocat/dsa-roadmaps',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer ghp_validToken12345',
            'User-Agent': 'Career-OS',
          }),
        })
      );

      fetchSpy.mockRestore();
    });

    it('throws BadRequestError when personal access token lacks push permission', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          full_name: 'octocat/read-only-repo',
          default_branch: 'main',
          private: false,
          permissions: { push: false, pull: true },
        }),
      } as Response);

      await expect(
        service.verifyGithubConfig('user-1', {
          githubUsername: 'octocat',
          githubRepo: 'read-only-repo',
          personalAccessToken: 'ghp_readOnlyToken',
        })
      ).rejects.toThrow(BadRequestError);

      fetchSpy.mockRestore();
    });

    it('throws UnauthorizedError when GitHub returns 401 Unauthorized', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Bad credentials',
      } as Response);

      await expect(
        service.verifyGithubConfig('user-1', {
          githubUsername: 'octocat',
          githubRepo: 'dsa-roadmaps',
          personalAccessToken: 'ghp_invalidToken',
        })
      ).rejects.toThrow(UnauthorizedError);

      fetchSpy.mockRestore();
    });

    it('throws NotFoundError when GitHub returns 404 Not Found', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      } as Response);

      await expect(
        service.verifyGithubConfig('user-1', {
          githubUsername: 'octocat',
          githubRepo: 'non-existent-repo',
          personalAccessToken: 'ghp_validToken',
        })
      ).rejects.toThrow(NotFoundError);

      fetchSpy.mockRestore();
    });

    it('uses saved encrypted configuration when verify is called without body arguments', async () => {
      const pat = 'ghp_savedToken1234567890';
      mockGithubConfigRepo.findByUserId.mockResolvedValue({
        githubUsername: 'saved-octocat',
        githubRepo: 'saved-repo',
        accessTokenEncrypted: encryptSecret(pat),
        isConfigured: true,
      });

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          full_name: 'saved-octocat/saved-repo',
          default_branch: 'main',
          private: false,
          permissions: { push: true },
        }),
      } as Response);

      const res = await service.verifyGithubConfig('user-1');

      expect(res.valid).toBe(true);
      expect(res.repository).toBe('saved-octocat/saved-repo');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.github.com/repos/saved-octocat/saved-repo',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${pat}`,
          }),
        })
      );

      fetchSpy.mockRestore();
    });
  });
});
