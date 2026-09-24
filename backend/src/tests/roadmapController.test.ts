import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/tokens';
import { RoadmapService } from '../services/roadmap.service';
import { NotFoundError } from '../errors/appError';
import { RoadmapStatus } from '@prisma/client';

describe('Roadmap Endpoints Integration Tests (/api/v1/roadmaps)', () => {
  const testUser = {
    id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
    email: 'roadmap_tester@career-os.dev',
  };
  let authToken: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    authToken = generateAccessToken(testUser);
  });

  describe('POST /api/v1/roadmaps', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/v1/roadmaps')
        .send({ title: 'DSA Sheet', sourceType: 'URL' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Access token missing');
    });

    it('rejects invalid payload with 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/v1/roadmaps')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sourceType: 'URL' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('rejects invalid sourceType with 400', async () => {
      const res = await request(app)
        .post('/api/v1/roadmaps')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'DSA Sheet', sourceType: 'INVALID_TYPE' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('creates roadmap successfully with 201 when authenticated', async () => {
      const mockCreated = {
        id: 'roadmap-uuid-123',
        userId: testUser.id,
        title: 'Blind 75',
        sourceType: 'URL',
        sourceUrl: 'https://leetcode.com',
        status: RoadmapStatus.PROCESSING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        errorMessage: null,
      };

      vi.spyOn(RoadmapService.prototype, 'createRoadmap').mockResolvedValueOnce(mockCreated as any);

      const res = await request(app)
        .post('/api/v1/roadmaps')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Blind 75',
          sourceType: 'URL',
          sourceUrl: 'https://leetcode.com',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('roadmap-uuid-123');
      expect(res.body.data.title).toBe('Blind 75');
    });
  });

  describe('GET /api/v1/roadmaps', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/roadmaps');

      expect(res.status).toBe(401);
    });

    it('returns 200 with list of user roadmaps when authenticated', async () => {
      const mockList = [
        {
          id: 'r-1',
          userId: testUser.id,
          title: 'NeetCode 150',
          sourceType: 'URL',
          status: RoadmapStatus.COMPLETED,
        },
      ];

      vi.spyOn(RoadmapService.prototype, 'getUserRoadmaps').mockResolvedValueOnce(mockList as any);

      const res = await request(app)
        .get('/api/v1/roadmaps')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('NeetCode 150');
    });
  });

  describe('GET /api/v1/roadmaps/:id', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/roadmaps/some-id');

      expect(res.status).toBe(401);
    });

    it('returns 200 with roadmap details when found', async () => {
      const mockRoadmap = {
        id: 'r-1',
        userId: testUser.id,
        title: 'Striver SDE Sheet',
        sourceType: 'URL',
        status: RoadmapStatus.COMPLETED,
      };

      vi.spyOn(RoadmapService.prototype, 'getRoadmapById').mockResolvedValueOnce(mockRoadmap as any);

      const res = await request(app)
        .get('/api/v1/roadmaps/r-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('r-1');
      expect(res.body.data.title).toBe('Striver SDE Sheet');
    });

    it('forwards error to error handler when service throws NotFoundError', async () => {
      vi.spyOn(RoadmapService.prototype, 'getRoadmapById').mockRejectedValueOnce(
        new NotFoundError('Roadmap not found')
      );

      const res = await request(app)
        .get('/api/v1/roadmaps/missing-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Roadmap not found');
    });
  });

  describe('DELETE /api/v1/roadmaps/:id', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).delete('/api/v1/roadmaps/r-1');

      expect(res.status).toBe(401);
    });

    it('returns 200 with deleted roadmap when authenticated and authorized', async () => {
      const mockDeleted = {
        id: 'r-1',
        userId: testUser.id,
        title: 'Deleted Roadmap',
      };

      vi.spyOn(RoadmapService.prototype, 'deleteRoadmap').mockResolvedValueOnce(mockDeleted as any);

      const res = await request(app)
        .delete('/api/v1/roadmaps/r-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('r-1');
    });
  });
});
