import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoadmapRepository } from '../repositories/roadmap.repository';
import prisma from '../config/db';
import { NotFoundError } from '../errors/appError';

vi.mock('../config/db', () => ({
  default: {
    roadmap: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('RoadmapRepository Unit Tests', () => {
  let repo: RoadmapRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new RoadmapRepository();
  });

  describe('findRoadmapById', () => {
    it('uses findFirst with id and userId', async () => {
      const mockRoadmap = { id: 'r-123', userId: 'u-456', title: 'NeetCode 150' };
      (prisma.roadmap.findFirst as any).mockResolvedValueOnce(mockRoadmap);

      const result = await repo.findRoadmapById('r-123', 'u-456');

      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'r-123', userId: 'u-456' },
        })
      );
      expect(result).toEqual(mockRoadmap);
    });
  });

  describe('findRoadmapStatusById', () => {
    it('uses findFirst with id and userId for lightweight status query', async () => {
      const mockStatus = { id: 'r-123', status: 'COMPLETED' };
      (prisma.roadmap.findFirst as any).mockResolvedValueOnce(mockStatus);

      const result = await repo.findRoadmapStatusById('r-123', 'u-456');

      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'r-123', userId: 'u-456' },
          select: expect.any(Object),
        })
      );
      expect(result).toEqual(mockStatus);
    });
  });

  describe('deleteRoadmap', () => {
    it('throws NotFoundError if roadmap does not belong to user', async () => {
      (prisma.roadmap.findFirst as any).mockResolvedValueOnce(null);

      await expect(repo.deleteRoadmap('r-123', 'u-456')).rejects.toThrow(NotFoundError);
      expect(prisma.roadmap.delete).not.toHaveBeenCalled();
    });

    it('deletes by primary key id after confirming ownership', async () => {
      const mockExisting = { id: 'r-123', userId: 'u-456' };
      (prisma.roadmap.findFirst as any).mockResolvedValueOnce(mockExisting);
      (prisma.roadmap.delete as any).mockResolvedValueOnce(mockExisting);

      const result = await repo.deleteRoadmap('r-123', 'u-456');

      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith({
        where: { id: 'r-123', userId: 'u-456' },
      });
      expect(prisma.roadmap.delete).toHaveBeenCalledWith({
        where: { id: 'r-123' },
      });
      expect(result).toEqual(mockExisting);
    });
  });
});
