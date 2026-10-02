import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/tokens';
import { SettingsService } from '../services/settings.service';

describe('Settings Endpoints Integration Tests (/api/v1/settings)', () => {
  const testUser = {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    email: 'settings_tester@career-os.dev',
  };
  let authToken: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    authToken = generateAccessToken(testUser);
  });

  describe('API Key Management Endpoints', () => {
    it('POST /api/v1/settings/api-keys rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/v1/settings/api-keys')
        .send({ name: 'My Key' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/settings/api-keys creates an API key with 201 when authenticated', async () => {
      const mockResult = {
        apiKey: {
          id: 'key-123',
          name: 'cos-leet Extension',
          keyPrefix: 'cos_live_a1b2c3...',
          createdAt: new Date(),
        },
        rawKey: 'cos_live_a1b2c3d4e5f67890abcdef123456',
      };

      vi.spyOn(SettingsService.prototype, 'createApiKey').mockResolvedValue(
        mockResult as any
      );

      const res = await request(app)
        .post('/api/v1/settings/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'cos-leet Extension', expiresInDays: 60 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rawKey).toBe(mockResult.rawKey);
      expect(res.body.data.apiKey.id).toBe('key-123');
    });

    it('GET /api/v1/settings/api-keys returns list of API keys with 200', async () => {
      const mockKeys = [
        {
          id: 'key-123',
          name: 'cos-leet Extension',
          keyPrefix: 'cos_live_a1b2c3...',
          createdAt: new Date(),
        },
      ];

      vi.spyOn(SettingsService.prototype, 'listApiKeys').mockResolvedValue(
        mockKeys as any
      );

      const res = await request(app)
        .get('/api/v1/settings/api-keys')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe('key-123');
    });

    it('DELETE /api/v1/settings/api-keys/:id revokes API key with 200', async () => {
      vi.spyOn(SettingsService.prototype, 'revokeApiKey').mockResolvedValue({
        id: 'key-123',
        revokedAt: new Date(),
      });

      const res = await request(app)
        .delete('/api/v1/settings/api-keys/key-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('key-123');
    });
  });

  describe('GitHub Configuration Endpoints', () => {
    it('GET /api/v1/settings/github returns current config with 200', async () => {
      vi.spyOn(SettingsService.prototype, 'getGithubConfig').mockResolvedValue({
        isConfigured: true,
        githubUsername: 'octocat',
        githubRepo: 'career-os-solutions',
        githubBranch: 'main',
      });

      const res = await request(app)
        .get('/api/v1/settings/github')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isConfigured).toBe(true);
      expect(res.body.data.githubUsername).toBe('octocat');
    });

    it('PUT /api/v1/settings/github rejects invalid payload with 400 when PAT is missing', async () => {
      const res = await request(app)
        .put('/api/v1/settings/github')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          githubUsername: 'octocat',
          githubRepo: 'solutions',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/v1/settings/github saves valid configuration with 200', async () => {
      vi.spyOn(SettingsService.prototype, 'upsertGithubConfig').mockResolvedValue({
        isConfigured: true,
        githubUsername: 'octocat',
        githubRepo: 'career-os-solutions',
        githubBranch: 'main',
      });

      const res = await request(app)
        .put('/api/v1/settings/github')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          githubUsername: 'octocat',
          githubRepo: 'career-os-solutions',
          personalAccessToken: 'ghp_validTokenLongEnough12345',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.githubRepo).toBe('career-os-solutions');
    });

    it('POST /api/v1/settings/github/verify returns verified status with 200', async () => {
      vi.spyOn(SettingsService.prototype, 'verifyGithubConfig').mockResolvedValue({
        valid: true,
        repository: 'octocat/career-os-solutions',
        defaultBranch: 'main',
        isPrivate: false,
        hasPushAccess: true,
      });

      const res = await request(app)
        .post('/api/v1/settings/github/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          githubUsername: 'octocat',
          githubRepo: 'career-os-solutions',
          personalAccessToken: 'ghp_validTokenLongEnough12345',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.hasPushAccess).toBe(true);
    });
  });
});
