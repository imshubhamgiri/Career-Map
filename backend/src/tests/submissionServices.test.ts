import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnrecoverableError } from 'bullmq';
import {
  Difficulty,
  GithubSyncStatus,
  LlmStatus,
  ProgressStatus,
} from '@prisma/client';

// Mock prisma transaction to pass mock tx object
vi.mock('../config/db', () => ({
  default: {
    $transaction: vi.fn(async (cb: any) => cb({})),
  },
  prisma: {
    $transaction: vi.fn(async (cb: any) => cb({})),
  },
}));

const mockRedisSet = vi.fn();
vi.mock('../config/redis', () => ({
  redisConnectionOptions: { host: '127.0.0.1', port: 6379 },
  redisClient: {
    set: (...args: any[]) => mockRedisSet(...args),
  },
}));

const mockQueueSubmission = vi.fn();
vi.mock('../queues/submission.queue', () => ({
  SUBMISSION_QUEUE_NAME: 'submission-queue',
  queueSubmission: (...args: any[]) => mockQueueSubmission(...args),
}));

const mockQueueGithubSync = vi.fn();
vi.mock('../queues/githubSync.queue', () => ({
  GITHUB_SYNC_QUEUE_NAME: 'github-sync-queue',
  queueGithubSync: (...args: any[]) => mockQueueGithubSync(...args),
}));

import { computeCodeHash, stripCommentsAndNormalizeWhitespace } from '../utils/codeHash';
import { encryptSecret, decryptSecret } from '../utils/crypto';
import { CreateSubmissionSchema } from '../schemas/submission.schema';
import { SubmissionService } from '../services/submission.service';
import { GithubSyncService } from '../services/githubSync.service';
import { BadRequestError, NotFoundError } from '../errors/appError';

describe('Submission Pipeline — Utilities, Repositories & Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('computeCodeHash & stripCommentsAndNormalizeWhitespace', () => {
    it('produces the exact same hash when only comments or whitespace differ', () => {
      const code1 = `
        // Two Sum solution
        function twoSum(nums: number[], target: number): number[] {
          const map = new Map(); /* store complements */
          return [0, 1];
        }
      `;
      const code2 = `function twoSum(nums: number[], target: number): number[] { const map = new Map(); return [0, 1]; }`;

      expect(stripCommentsAndNormalizeWhitespace(code1)).toBe(
        stripCommentsAndNormalizeWhitespace(code2)
      );
      expect(computeCodeHash('TypeScript', code1)).toBe(
        computeCodeHash('typescript', code2)
      );
    });

    it('preserves comment-like characters inside string literals', () => {
      const code1 = `const url = "https://leetcode.com/problems // not a comment";`;
      const code2 = `const url = "https://leetcode.com/problems"; // actual comment`;
      expect(computeCodeHash('javascript', code1)).not.toBe(
        computeCodeHash('javascript', code2)
      );
    });
  });

  describe('AES-256-GCM Secret Encryption', () => {
    it('encrypts and decrypts GitHub Personal Access Tokens accurately', () => {
      const pat = 'ghp_1234567890abcdefghijklmnopqrstuvwxyzABCD';
      const encrypted = encryptSecret(pat);
      expect(encrypted).not.toContain(pat);
      expect(encrypted.split(':')).toHaveLength(3);
      expect(decryptSecret(encrypted)).toBe(pat);
    });

    it('throws when ciphertext is malformed or tampered with', () => {
      const encrypted = encryptSecret('ghp_secretToken');
      const [iv, tag] = encrypted.split(':');
      expect(() => decryptSecret(`${iv}:${tag}:0000`)).toThrow();
    });
  });

  describe('CreateSubmissionSchema Validation', () => {
    it('accepts both canonical fields and cos-leet extension aliases', () => {
      const parsed = CreateSubmissionSchema.parse({
        titleSlug: 'Two-Sum',
        questionTitle: '1. Two Sum',
        difficulty: 'Easy',
        problemId: 1,
        submissionId: 998877,
        code: 'class Solution {}',
        language: 'Java',
        runtime: 2,
        memory: '41.5 MB',
      });

      expect(parsed.slug).toBe('two-sum');
      expect(parsed.title).toBe('1. Two Sum');
      expect(parsed.questionId).toBe('1');
      expect(parsed.submissionId).toBe('998877');
      expect(parsed.runtime).toBe('2');
    });
  });

  describe('SubmissionService', () => {
    const mockSubmissionRepo = {
      findByUserAndProblem: vi.fn(),
      createSubmission: vi.fn(),
      touchSubmission: vi.fn(),
      updateSubmissionCode: vi.fn(),
      updateGithubSyncStatus: vi.fn(),
      resetForRetry: vi.fn(),
      findSubmissionsByUser: vi.fn(),
    };
    const mockProgressRepo = {
      upsertProgressEvent: vi.fn(),
    };
    const mockProblemsRepo = {
      upsertCanonicalProblem: vi.fn(),
    };
    const mockGithubConfigRepo = {
      findActiveByUserId: vi.fn(),
    };

    const service = new SubmissionService(
      mockSubmissionRepo as any,
      mockProgressRepo as any,
      mockProblemsRepo as any,
      mockGithubConfigRepo as any
    );

    it('ingestSubmission deduplicates identical requests within 15s Redis lock window', async () => {
      const payload = CreateSubmissionSchema.parse({
        slug: 'two-sum',
        title: 'Two Sum',
        code: 'def twoSum(): pass',
        language: 'Python3',
      });

      mockRedisSet.mockResolvedValueOnce('OK').mockResolvedValueOnce(null);

      const first = await service.ingestSubmission('user-1', payload);
      expect(first.status).toBe('queued');
      expect(mockQueueSubmission).toHaveBeenCalledTimes(1);

      const second = await service.ingestSubmission('user-1', payload);
      expect(second.status).toBe('deduplicated');
      expect(mockQueueSubmission).toHaveBeenCalledTimes(1);
    });

    it('Case A (First-Time Solve): creates ProgressEvent + Submission and enqueues githubSyncQueue when GitHub is configured', async () => {
      const codeHash = computeCodeHash('cpp', 'int main() {}');
      mockProblemsRepo.upsertCanonicalProblem.mockResolvedValue({
        id: 'prob-uuid-1',
        canonicalSlug: 'two-sum',
      });
      mockSubmissionRepo.findByUserAndProblem.mockResolvedValue(null);
      mockProgressRepo.upsertProgressEvent.mockResolvedValue({
        id: 'prog-uuid-1',
      });
      mockSubmissionRepo.createSubmission.mockResolvedValue({
        id: 'sub-uuid-1',
        userId: 'user-1',
        problemId: 'prob-uuid-1',
        codeHash,
      });
      mockGithubConfigRepo.findActiveByUserId.mockResolvedValue({
        userId: 'user-1',
        isConfigured: true,
      });

      const result = await service.processSubmissionJob({
        userId: 'user-1',
        submissionId: 'ext-123',
        problemId: '1',
        titleSlug: 'two-sum',
        questionTitle: 'Two Sum',
        difficulty: 'Easy',
        code: 'int main() {}',
        codeHash,
        language: 'cpp',
        status: 'Accepted',
        runtime: '0 ms',
        memory: '10 MB',
        timestamp: Date.now(),
      });

      expect(result.case).toBe('A_FIRST_SOLVE');
      expect(result.githubSyncQueued).toBe(true);
      expect(mockQueueGithubSync).toHaveBeenCalledWith(
        {
          submissionId: 'sub-uuid-1',
          userId: 'user-1',
          problemId: 'prob-uuid-1',
          codeHash,
        },
        `gh-sync-sub-uuid-1-${codeHash.slice(0, 12)}`
      );
    });

    it('Case A with GitHub NOT configured: marks submission SKIPPED without enqueueing githubSyncQueue', async () => {
      const codeHash = computeCodeHash('cpp', 'int main() {}');
      mockProblemsRepo.upsertCanonicalProblem.mockResolvedValue({
        id: 'prob-uuid-1',
        canonicalSlug: 'two-sum',
      });
      mockSubmissionRepo.findByUserAndProblem.mockResolvedValue(null);
      mockProgressRepo.upsertProgressEvent.mockResolvedValue({
        id: 'prog-uuid-1',
      });
      mockSubmissionRepo.createSubmission.mockResolvedValue({
        id: 'sub-uuid-1',
        userId: 'user-1',
        problemId: 'prob-uuid-1',
        codeHash,
      });
      mockGithubConfigRepo.findActiveByUserId.mockResolvedValue(null);
      mockSubmissionRepo.updateGithubSyncStatus.mockResolvedValue({
        id: 'sub-uuid-1',
        githubSyncStatus: GithubSyncStatus.SKIPPED,
        syncError: 'GITHUB_CONFIG_MISSING',
      });

      const result = await service.processSubmissionJob({
        userId: 'user-1',
        submissionId: 'ext-123',
        problemId: '1',
        titleSlug: 'two-sum',
        questionTitle: 'Two Sum',
        difficulty: 'Easy',
        code: 'int main() {}',
        codeHash,
        language: 'cpp',
        status: 'Accepted',
        runtime: '0 ms',
        memory: '10 MB',
        timestamp: Date.now(),
      });

      expect(result.case).toBe('A_FIRST_SOLVE');
      expect(result.githubSyncQueued).toBe(false);
      expect(mockSubmissionRepo.updateGithubSyncStatus).toHaveBeenCalledWith(
        'sub-uuid-1',
        GithubSyncStatus.SKIPPED,
        'GITHUB_CONFIG_MISSING'
      );
      expect(mockQueueGithubSync).not.toHaveBeenCalled();
    });

    it('Case B (Identical Code Revision): touches timestamps and stops immediately without LLM or GitHub sync', async () => {
      const codeHash = computeCodeHash('cpp', 'int main() {}');
      mockProblemsRepo.upsertCanonicalProblem.mockResolvedValue({
        id: 'prob-uuid-1',
        canonicalSlug: 'two-sum',
      });
      mockSubmissionRepo.findByUserAndProblem.mockResolvedValue({
        id: 'sub-uuid-1',
        codeHash,
        progressEvent: { solvedAt: new Date() },
      });
      mockSubmissionRepo.touchSubmission.mockResolvedValue({
        id: 'sub-uuid-1',
        codeHash,
      });

      const result = await service.processSubmissionJob({
        userId: 'user-1',
        submissionId: 'ext-124',
        problemId: '1',
        titleSlug: 'two-sum',
        questionTitle: 'Two Sum',
        difficulty: 'Easy',
        code: 'int main() {} // comment added',
        codeHash,
        language: 'cpp',
        status: 'Accepted',
        runtime: '0 ms',
        memory: '10 MB',
        timestamp: Date.now(),
      });

      expect(result.case).toBe('B_IDENTICAL_CODE');
      expect(result.githubSyncQueued).toBe(false);
      expect(mockSubmissionRepo.touchSubmission).toHaveBeenCalledTimes(1);
      expect(mockQueueGithubSync).not.toHaveBeenCalled();
    });

    it('Case C (Better / Different Solution): updates code in-place, resets statuses, and enqueues githubSyncQueue', async () => {
      const oldHash = computeCodeHash('cpp', 'int bruteForce() {}');
      const newHash = computeCodeHash('cpp', 'int optimalHashMap() {}');

      mockProblemsRepo.upsertCanonicalProblem.mockResolvedValue({
        id: 'prob-uuid-1',
        canonicalSlug: 'two-sum',
      });
      mockSubmissionRepo.findByUserAndProblem.mockResolvedValue({
        id: 'sub-uuid-1',
        codeHash: oldHash,
        progressEvent: { solvedAt: new Date() },
      });
      mockSubmissionRepo.updateSubmissionCode.mockResolvedValue({
        id: 'sub-uuid-1',
        codeHash: newHash,
        llmStatus: LlmStatus.PENDING,
        githubSyncStatus: GithubSyncStatus.PENDING,
      });
      mockGithubConfigRepo.findActiveByUserId.mockResolvedValue({
        userId: 'user-1',
        isConfigured: true,
      });

      const result = await service.processSubmissionJob({
        userId: 'user-1',
        submissionId: 'ext-125',
        problemId: '1',
        titleSlug: 'two-sum',
        questionTitle: 'Two Sum',
        difficulty: 'Easy',
        code: 'int optimalHashMap() {}',
        codeHash: newHash,
        language: 'cpp',
        status: 'Accepted',
        runtime: '0 ms',
        memory: '10 MB',
        timestamp: Date.now(),
      });

      expect(result.case).toBe('C_UPDATED_CODE');
      expect(result.githubSyncQueued).toBe(true);
      expect(mockSubmissionRepo.updateSubmissionCode).toHaveBeenCalledTimes(1);
      expect(mockQueueGithubSync).toHaveBeenCalledTimes(1);
    });

    it('retrySubmissionSync preserves LLM checkpoint in Mode 3 (GITHUB_PUSH_ONLY) and throws when unconfigured', async () => {
      mockSubmissionRepo.findByUserAndProblem.mockResolvedValueOnce(null);
      await expect(
        service.retrySubmissionSync('user-1', 'prob-1')
      ).rejects.toThrow(NotFoundError);

      mockSubmissionRepo.findByUserAndProblem.mockResolvedValue({
        id: 'sub-1',
        problemId: 'prob-1',
        codeHash: 'hash123',
        llmStatus: LlmStatus.COMPLETED,
        annotatedCode: '// annotated',
        progressEvent: { aiNotes: '### Intuition' },
      });
      mockGithubConfigRepo.findActiveByUserId.mockResolvedValueOnce(null);

      await expect(
        service.retrySubmissionSync('user-1', 'prob-1')
      ).rejects.toThrow(BadRequestError);

      mockGithubConfigRepo.findActiveByUserId.mockResolvedValueOnce({
        userId: 'user-1',
        isConfigured: true,
      });

      const retryRes = await service.retrySubmissionSync('user-1', 'prob-1');
      expect(retryRes.mode).toBe('GITHUB_PUSH_ONLY');
      expect(mockSubmissionRepo.resetForRetry).toHaveBeenCalledWith('sub-1', false);
      expect(mockQueueGithubSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('GithubSyncService', () => {
    const mockSubRepo = {
      findById: vi.fn(),
      updateLlmStatus: vi.fn(),
      saveLlmCheckpoint: vi.fn(),
      updateGithubSyncStatus: vi.fn(),
      markGithubSynced: vi.fn(),
    };
    const mockGhConfigRepo = {
      findActiveByUserId: vi.fn(),
      updateLastSyncedAt: vi.fn(),
    };

    const syncService = new GithubSyncService(
      mockSubRepo as any,
      mockGhConfigRepo as any
    );

    it('aborts immediately when Stale-Job Guard detects mismatched codeHash', async () => {
      mockSubRepo.findById.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        problemId: 'prob-1',
        codeHash: 'newer-hash-in-db',
      });

      const res = await syncService.processGithubSyncJob({
        submissionId: 'sub-1',
        userId: 'user-1',
        problemId: 'prob-1',
        codeHash: 'stale-hash-in-job',
      });

      expect(res.status).toBe('ABORTED_STALE');
      expect(mockSubRepo.updateLlmStatus).not.toHaveBeenCalled();
    });

    it('skips Stage 1 LLM call when checkpoint is already COMPLETED and throws UnrecoverableError on 401 GitHub auth failure', async () => {
      const encryptedPat = encryptSecret('ghp_expired_token');
      mockSubRepo.findById.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        problemId: 'prob-1',
        codeHash: 'hash-1',
        language: 'Python3',
        code: 'def solve(): pass',
        annotatedCode: '# Step 1\ndef solve(): pass',
        llmStatus: LlmStatus.COMPLETED,
        problem: {
          title: 'Two Sum',
          canonicalSlug: 'two-sum',
          difficulty: Difficulty.EASY,
        },
        progressEvent: {
          aiNotes: '### Intuition\nUse a hash map.',
          status: ProgressStatus.SOLVED,
        },
      });

      mockGhConfigRepo.findActiveByUserId.mockResolvedValue({
        userId: 'user-1',
        githubUsername: 'octocat',
        githubRepo: 'leetcode-solutions',
        githubBranch: 'main',
        accessTokenEncrypted: encryptedPat,
        isConfigured: true,
      });

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 401,
        ok: false,
        text: async () => '{"message":"Bad credentials"}',
      } as Response);

      await expect(
        syncService.processGithubSyncJob({
          submissionId: 'sub-1',
          userId: 'user-1',
          problemId: 'prob-1',
          codeHash: 'hash-1',
        })
      ).rejects.toThrow(UnrecoverableError);

      // Verify Stage 1 LLM was skipped
      expect(mockSubRepo.updateLlmStatus).not.toHaveBeenCalled();
      // Verify FAILED status was recorded in DB before throwing UnrecoverableError
      expect(mockSubRepo.updateGithubSyncStatus).toHaveBeenLastCalledWith(
        'sub-1',
        GithubSyncStatus.FAILED,
        expect.stringContaining('GITHUB_AUTH_INVALID')
      );

      fetchSpy.mockRestore();
    });
  });
});
