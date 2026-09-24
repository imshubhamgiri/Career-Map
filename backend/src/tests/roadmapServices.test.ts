import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoadmapService } from '../services/roadmap.service';
import { ProblemService, ExtractedQuestionInput } from '../services/problems.service';
import { RoadmapStatus, Difficulty } from '@prisma/client';
import { extractTextFromUrl } from '../services/ingestion/dispatcher.service';
import { processDocumentPipeline } from '../services/ingestion/pipeline.service';

vi.mock('../services/ingestion/dispatcher.service', () => ({
  extractTextFromUrl: vi.fn(),
}));

vi.mock('../services/ingestion/pipeline.service', () => ({
  processDocumentPipeline: vi.fn(),
}));

vi.mock('../config/db', () => {
  const mockTx = {
    problem: {
      findMany: vi.fn(),
      createManyAndReturn: vi.fn(),
    },
    roadmapProblem: {
      createMany: vi.fn(),
    },
  };
  return {
    default: {
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mockTx)),
      ...mockTx,
    },
  };
});

describe('RoadmapService Unit Tests', () => {
  let mockRoadmapRepo: any;
  let mockProblemService: any;
  let roadmapService: RoadmapService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRoadmapRepo = {
      createRoadmap: vi.fn(),
      findRoadmapById: vi.fn(),
      findRoadmapsByUserId: vi.fn(),
      updateRoadmapStatus: vi.fn(),
      findCompletedBySourceUrl: vi.fn(),
      cloneRoadmapWithProblems: vi.fn(),
      deleteRoadmap: vi.fn(),
    };

    mockProblemService = {
      saveExtractedProblems: vi.fn(),
    };

    roadmapService = new RoadmapService(mockRoadmapRepo, mockProblemService);
  });

  describe('CRUD Operations', () => {
    it('createRoadmap calls repository with correct payload', async () => {
      const input = {
        userId: 'u-1',
        title: 'NeetCode 150',
        sourceType: 'URL' as const,
        sourceUrl: 'https://neetcode.io',
      };
      mockRoadmapRepo.createRoadmap.mockResolvedValueOnce({ id: 'r-1', ...input });

      const result = await roadmapService.createRoadmap(input);

      expect(mockRoadmapRepo.createRoadmap).toHaveBeenCalledWith(input);
      expect(result.id).toBe('r-1');
    });

    it('getRoadmapById retrieves roadmap by ID', async () => {
      mockRoadmapRepo.findRoadmapById.mockResolvedValueOnce({ id: 'r-1', title: 'Roadmap' });

      const result = await roadmapService.getRoadmapById('r-1', 'u-1');

      expect(mockRoadmapRepo.findRoadmapById).toHaveBeenCalledWith('r-1');
      expect(result?.title).toBe('Roadmap');
    });

    it('getUserRoadmaps lists all roadmaps for a user', async () => {
      mockRoadmapRepo.findRoadmapsByUserId.mockResolvedValueOnce([{ id: 'r-1' }, { id: 'r-2' }]);

      const result = await roadmapService.getUserRoadmaps('u-1');

      expect(mockRoadmapRepo.findRoadmapsByUserId).toHaveBeenCalledWith('u-1');
      expect(result).toHaveLength(2);
    });

    it('updateStatus updates lifecycle state and optional error message', async () => {
      mockRoadmapRepo.updateRoadmapStatus.mockResolvedValueOnce({
        id: 'r-1',
        status: RoadmapStatus.FAILED,
        errorMessage: 'Parsing timed out',
      });

      const result = await roadmapService.updateStatus(
        'r-1',
        RoadmapStatus.FAILED,
        'Parsing timed out'
      );

      expect(mockRoadmapRepo.updateRoadmapStatus).toHaveBeenCalledWith(
        'r-1',
        RoadmapStatus.FAILED,
        'Parsing timed out'
      );
      expect(result.status).toBe(RoadmapStatus.FAILED);
    });

    it('cloneRoadmap clones template roadmap and junction items for new user', async () => {
      mockRoadmapRepo.cloneRoadmapWithProblems.mockResolvedValueOnce({
        id: 'cloned-r-2',
        userId: 'new-u-2',
        title: 'Custom Cloned Title',
      });

      const result = await roadmapService.cloneRoadmap('r-1', 'new-u-2', 'Custom Cloned Title');

      expect(mockRoadmapRepo.cloneRoadmapWithProblems).toHaveBeenCalledWith(
        'r-1',
        'new-u-2',
        'Custom Cloned Title'
      );
      expect(result.id).toBe('cloned-r-2');
    });

    it('deleteRoadmap deletes roadmap belonging to user', async () => {
      mockRoadmapRepo.deleteRoadmap.mockResolvedValueOnce({ id: 'r-1' });

      const result = await roadmapService.deleteRoadmap('r-1', 'u-1');

      expect(mockRoadmapRepo.deleteRoadmap).toHaveBeenCalledWith('r-1', 'u-1');
      expect(result.id).toBe('r-1');
    });
  });

  describe('processIngestion() Pipeline Orchestration', () => {
    it('completes successfully when pipeline succeeds with problems', async () => {
      (extractTextFromUrl as any).mockResolvedValueOnce(['Row 1', 'Row 2']);
      (processDocumentPipeline as any).mockResolvedValueOnce({
        success: true,
        data: [
          { title: 'Two Sum', difficulty: 'Easy', platform: 'LeetCode', category: 'Arrays' },
        ],
      });

      await roadmapService.processIngestion('r-1', 'https://leetcode.com/list');

      expect(extractTextFromUrl).toHaveBeenCalledWith('https://leetcode.com/list');
      expect(processDocumentPipeline).toHaveBeenCalledWith(['Row 1', 'Row 2']);
      expect(mockProblemService.saveExtractedProblems).toHaveBeenCalledWith('r-1', expect.any(Array));
      expect(mockRoadmapRepo.updateRoadmapStatus).toHaveBeenCalledWith(
        'r-1',
        RoadmapStatus.COMPLETED,
        undefined
      );
    });

    it('fails roadmap when pipeline returns success: false', async () => {
      (extractTextFromUrl as any).mockResolvedValueOnce(['Row 1']);
      (processDocumentPipeline as any).mockResolvedValueOnce({
        success: false,
        message: 'LLM failed to parse response',
        data: [],
      });

      await roadmapService.processIngestion('r-1', 'https://invalid-url.com');

      expect(mockProblemService.saveExtractedProblems).not.toHaveBeenCalled();
      expect(mockRoadmapRepo.updateRoadmapStatus).toHaveBeenCalledWith(
        'r-1',
        RoadmapStatus.FAILED,
        'LLM failed to parse response'
      );
    });

    it('fails roadmap when 0 problems are detected', async () => {
      (extractTextFromUrl as any).mockResolvedValueOnce(['Some text without DSA questions']);
      (processDocumentPipeline as any).mockResolvedValueOnce({
        success: true,
        data: [],
      });

      await roadmapService.processIngestion('r-1', 'https://some-blog.com');

      expect(mockProblemService.saveExtractedProblems).not.toHaveBeenCalled();
      expect(mockRoadmapRepo.updateRoadmapStatus).toHaveBeenCalledWith(
        'r-1',
        RoadmapStatus.FAILED,
        'No DSA problems detected in document'
      );
    });

    it('catches unhandled extraction errors and marks roadmap FAILED', async () => {
      (extractTextFromUrl as any).mockRejectedValueOnce(new Error('Network connection timeout'));

      await roadmapService.processIngestion('r-1', 'https://down-site.com');

      expect(mockRoadmapRepo.updateRoadmapStatus).toHaveBeenCalledWith(
        'r-1',
        RoadmapStatus.FAILED,
        'Network connection timeout'
      );
    });
  });
});

describe('ProblemService Unit Tests', () => {
  let mockProblemRepo: any;
  let problemService: ProblemService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockProblemRepo = {
      findProblemsByCanonicalSlugs: vi.fn(),
      createManyCanonicalProblems: vi.fn(),
      createRoadmapProblems: vi.fn(),
    };

    problemService = new ProblemService(mockProblemRepo);
  });

  it('early returns when extracted data is empty', async () => {
    await problemService.saveExtractedProblems('r-1', []);

    expect(mockProblemRepo.findProblemsByCanonicalSlugs).not.toHaveBeenCalled();
    expect(mockProblemRepo.createManyCanonicalProblems).not.toHaveBeenCalled();
  });

  it('deduplicates incoming items by canonicalSlug within the same batch', async () => {
    const duplicateBatch: ExtractedQuestionInput[] = [
      {
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum',
        difficulty: 'Easy',
        platform: 'LeetCode',
        category: 'Arrays',
      },
      {
        title: 'Two Sum (Duplicate)',
        url: 'https://leetcode.com/problems/two-sum/description',
        difficulty: 'Easy',
        platform: 'LeetCode',
        category: 'HashMaps',
      },
    ];

    mockProblemRepo.findProblemsByCanonicalSlugs.mockResolvedValueOnce([
      { id: 'p-1', canonicalSlug: 'two-sum' },
    ]);
    mockProblemRepo.createRoadmapProblems.mockResolvedValueOnce({ count: 1 });

    await problemService.saveExtractedProblems('r-1', duplicateBatch);

    // Should only query for 1 unique slug
    expect(mockProblemRepo.findProblemsByCanonicalSlugs).toHaveBeenCalledWith(
      ['two-sum'],
      expect.anything()
    );

    // Should not create new canonical problem since it exists
    expect(mockProblemRepo.createManyCanonicalProblems).not.toHaveBeenCalled();

    // Should only insert 1 junction row
    expect(mockProblemRepo.createRoadmapProblems).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          roadmapId: 'r-1',
          problemId: 'p-1',
        }),
      ]),
      expect.anything()
    );
  });

  it('partitions existing vs missing canonical problems and bulk inserts new ones', async () => {
    const batch: ExtractedQuestionInput[] = [
      {
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum',
        difficulty: 'Easy',
        platform: 'LeetCode',
        category: 'Arrays',
      },
      {
        title: '3Sum',
        url: 'https://leetcode.com/problems/3sum',
        difficulty: 'Medium',
        platform: 'LeetCode',
        category: 'Two Pointers',
      },
    ];

    // Suppose Two Sum exists (id: p-1), but 3Sum does not
    mockProblemRepo.findProblemsByCanonicalSlugs.mockResolvedValueOnce([
      { id: 'p-1', canonicalSlug: 'two-sum' },
    ]);

    // Newly created 3Sum gets id: p-2
    mockProblemRepo.createManyCanonicalProblems.mockResolvedValueOnce([
      { id: 'p-2', canonicalSlug: '3sum' },
    ]);

    mockProblemRepo.createRoadmapProblems.mockResolvedValueOnce({ count: 2 });

    await problemService.saveExtractedProblems('r-1', batch);

    // 1. Verify missing canonical problem was created
    expect(mockProblemRepo.createManyCanonicalProblems).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          canonicalSlug: '3sum',
          title: '3Sum',
          difficulty: Difficulty.MEDIUM,
          platform: 'LeetCode',
        }),
      ],
      expect.anything()
    );

    // 2. Verify both junction rows were inserted with correct orderIndex
    expect(mockProblemRepo.createRoadmapProblems).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          roadmapId: 'r-1',
          problemId: 'p-1',
          orderIndex: 0,
        }),
        expect.objectContaining({
          roadmapId: 'r-1',
          problemId: 'p-2',
          orderIndex: 1,
        }),
      ],
      expect.anything()
    );
  });
});

