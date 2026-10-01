import prisma from '../config/db';
import {
  Difficulty,
  GithubSyncStatus,
  LlmStatus,
  ProgressStatus,
  Submission,
} from '@prisma/client';
import { redisClient } from '../config/redis';
import {
  SubmissionRepository,
  SubmissionWithRelations,
} from '../repositories/submission.repository';
import { ProgressRepository } from '../repositories/progress.repository';
import { ProblemsRepository } from '../repositories/problems.repository';
import { GithubConfigRepository } from '../repositories/githubConfig.repository';
import { queueSubmission, SubmissionJobData } from '../queues/submission.queue';
import { queueGithubSync } from '../queues/githubSync.queue';
import { ValidatedSubmissionPayload } from '../schemas/submission.schema';
import { computeCodeHash } from '../utils/codeHash';
import { resolveCanonicalSlug } from '../utils/canonicalSlug';
import { BadRequestError, NotFoundError } from '../errors/appError';
import { logger } from '../utils/logger';

const log = logger.child({ service: 'SubmissionService' });

export const languagesToExtensions: Record<string, string> = {
  Python: '.py',
  Python3: '.py',
  python: '.py',
  python3: '.py',
  'C++': '.cpp',
  cpp: '.cpp',
  C: '.c',
  c: '.c',
  Java: '.java',
  java: '.java',
  'C#': '.cs',
  csharp: '.cs',
  JavaScript: '.js',
  Javascript: '.js',
  javascript: '.js',
  Ruby: '.rb',
  ruby: '.rb',
  Swift: '.swift',
  swift: '.swift',
  Go: '.go',
  golang: '.go',
  go: '.go',
  Kotlin: '.kt',
  kotlin: '.kt',
  Scala: '.scala',
  scala: '.scala',
  Rust: '.rs',
  rust: '.rs',
  PHP: '.php',
  php: '.php',
  TypeScript: '.ts',
  typescript: '.ts',
  MySQL: '.sql',
  'MS SQL Server': '.sql',
  Oracle: '.sql',
  PostgreSQL: '.sql',
  sql: '.sql',
  'C++14': '.cpp',
  'C++17': '.cpp',
  'C++11': '.cpp',
  'C++98': '.cpp',
  'C++03': '.cpp',
  'C++20': '.cpp',
  'C++1z': '.cpp',
  'C++1y': '.cpp',
  'C++1x': '.cpp',
  'C++1a': '.cpp',
  CPP: '.cpp',
  Dart: '.dart',
  dart: '.dart',
  Elixir: '.ex',
  elixir: '.ex',
};

export function getExtensionForLanguage(language: string): string {
  const trimmed = (language || '').trim();
  return (
    languagesToExtensions[trimmed] ||
    languagesToExtensions[trimmed.toLowerCase()] ||
    '.txt'
  );
}

export function mapDifficultyEnum(rawDifficulty?: string): Difficulty {
  if (!rawDifficulty) return Difficulty.UNKNOWN;
  const upper = rawDifficulty.trim().toUpperCase();
  if (upper === 'EASY') return Difficulty.EASY;
  if (upper === 'MEDIUM') return Difficulty.MEDIUM;
  if (upper === 'HARD') return Difficulty.HARD;
  return Difficulty.UNKNOWN;
}

export interface IngestSubmissionResult {
  status: 'queued' | 'deduplicated';
  slug: string;
  codeHash: string;
  message: string;
}

export interface ProcessSubmissionJobResult {
  case: 'A_FIRST_SOLVE' | 'B_IDENTICAL_CODE' | 'C_UPDATED_CODE';
  submission: Submission;
  githubSyncQueued: boolean;
}

export class SubmissionService {
  constructor(
    private submissionRepo: SubmissionRepository = new SubmissionRepository(),
    private progressRepo: ProgressRepository = new ProgressRepository(),
    private problemsRepo: ProblemsRepository = new ProblemsRepository(),
    private githubConfigRepo: GithubConfigRepository = new GithubConfigRepository()
  ) {}

  /**
   * Layer 1 & 2: Validates, normalizes codeHash, performs 15s Redis network deduplication,
   * and enqueues the submission job into `submissionQueue`.
   */
  async ingestSubmission(
    userId: string,
    payload: ValidatedSubmissionPayload
  ): Promise<IngestSubmissionResult> {
    const slug = payload.slug.toLowerCase().trim();
    const codeHash = computeCodeHash(payload.language, payload.code);

    // Layer 2 Idempotency: Atomic 15-second Redis lock per (userId, slug, codeHash)
    const dedupeKey = `sub:dedupe:${userId}:${slug}:${codeHash}`;
    const acquired = await redisClient.set(dedupeKey, '1', 'EX', 15, 'NX');

    if (!acquired) {
      log.info(
        { userId, slug, codeHash },
        'Duplicate submission ignored within 15s network deduplication window'
      );
      return {
        status: 'deduplicated',
        slug,
        codeHash,
        message: 'Duplicate submission ignored within 15s window',
      };
    }

    const jobData: SubmissionJobData = {
      userId,
      submissionId: payload.submissionId ?? `${slug}-${Date.now()}`,
      problemId: payload.questionId ?? slug,
      titleSlug: slug,
      questionTitle: payload.title,
      difficulty: payload.difficulty ?? 'UNKNOWN',
      code: payload.code,
      codeHash,
      language: payload.language,
      status: payload.status ?? 'Accepted',
      runtime: payload.runtime ?? '',
      memory: payload.memory ?? '',
      timestamp: payload.timestamp ?? Date.now(),
    };

    await queueSubmission(jobData);

    return {
      status: 'queued',
      slug,
      codeHash,
      message: 'Submission queued for processing',
    };
  }

  /**
   * Worker 1 (`submissionWorker`) Business Logic:
   * 1. Upserts canonical Problem by `canonicalSlug`.
   * 2. Evaluates the 3-Case Decision Matrix on `(userId, problem.id)`:
   *    - Case A: First-time solve -> Upsert ProgressEvent (SOLVED) + Create Submission (PENDING).
   *    - Case B: Identical codeHash -> Touch updatedAt on ProgressEvent & Submission, STOP (no LLM, no GitHub push).
   *    - Case C: Different codeHash -> Touch ProgressEvent + Update Submission in-place & reset PENDING statuses.
   * 3. Checks GitHub Config Gate (`github_configs.is_configured`):
   *    - If missing/unconfigured -> Marks `githubSyncStatus = SKIPPED`, `syncError = GITHUB_CONFIG_MISSING`.
   *    - If configured -> Enqueues `githubSyncQueue` with deterministic `jobId: gh-sync-${submission.id}-${codeHash12}`.
   */
  async processSubmissionJob(
    jobData: SubmissionJobData
  ): Promise<ProcessSubmissionJobResult> {
    const { userId, code, language } = jobData;
    const rawSlug = jobData.titleSlug || resolveCanonicalSlug(jobData.questionTitle);
    const canonicalSlug = rawSlug.toLowerCase().trim();
    const codeHash = jobData.codeHash || computeCodeHash(language, code);
    const difficulty = mapDifficultyEnum(jobData.difficulty);
    const runtime = jobData.runtime !== undefined && jobData.runtime !== '' ? String(jobData.runtime) : null;
    const memory = jobData.memory !== undefined && jobData.memory !== '' ? String(jobData.memory) : null;
    const externalSubmissionId =
      jobData.submissionId !== undefined && jobData.submissionId !== ''
        ? String(jobData.submissionId)
        : null;

    // 1. Upsert canonical Problem by slug
    const problem = await this.problemsRepo.upsertCanonicalProblem({
      canonicalSlug,
      title: jobData.questionTitle || canonicalSlug,
      difficulty,
      platform: 'LeetCode',
      externalUrl: `https://leetcode.com/problems/${canonicalSlug}/`,
      platformProblemId:
        jobData.problemId && jobData.problemId !== canonicalSlug
          ? String(jobData.problemId)
          : undefined,
    });

    // 2. Fetch existing Submission by composite key (userId, problemId)
    const existing = await this.submissionRepo.findByUserAndProblem(userId, problem.id);

    // Case B: Identical code revision (existing.codeHash === incoming codeHash)
    if (existing && existing.codeHash === codeHash) {
      const touchedSubmission = await prisma.$transaction(async (tx) => {
        await this.progressRepo.upsertProgressEvent(
          {
            userId,
            problemId: problem.id,
            status: ProgressStatus.SOLVED,
            solvedAt: existing.progressEvent?.solvedAt ?? new Date(),
          },
          tx
        );

        return this.submissionRepo.touchSubmission(
          existing.id,
          { runtime, memory, externalSubmissionId },
          tx
        );
      });

      log.info(
        {
          userId,
          problemId: problem.id,
          submissionId: existing.id,
          canonicalSlug,
          codeHash,
        },
        'Case B: Identical codeHash detected; touched timestamps and skipped downstream LLM/GitHub sync'
      );

      return {
        case: 'B_IDENTICAL_CODE',
        submission: touchedSubmission,
        githubSyncQueued: false,
      };
    }

    let persistedSubmission: Submission;
    let decisionCase: 'A_FIRST_SOLVE' | 'C_UPDATED_CODE';

    if (!existing) {
      // Case A: First-Time Solve
      decisionCase = 'A_FIRST_SOLVE';
      persistedSubmission = await prisma.$transaction(async (tx) => {
        const progressEvent = await this.progressRepo.upsertProgressEvent(
          {
            userId,
            problemId: problem.id,
            status: ProgressStatus.SOLVED,
            solvedAt: new Date(),
          },
          tx
        );

        return this.submissionRepo.createSubmission(
          {
            userId,
            problemId: problem.id,
            progressEventId: progressEvent.id,
            code,
            codeHash,
            language,
            runtime,
            memory,
            externalSubmissionId,
            llmStatus: LlmStatus.PENDING,
            githubSyncStatus: GithubSyncStatus.PENDING,
          },
          tx
        );
      });

      log.info(
        {
          userId,
          problemId: problem.id,
          submissionId: persistedSubmission.id,
          canonicalSlug,
        },
        'Case A: First-time solve persisted'
      );
    } else {
      // Case C: Better / Different Solution Code
      decisionCase = 'C_UPDATED_CODE';
      persistedSubmission = await prisma.$transaction(async (tx) => {
        await this.progressRepo.upsertProgressEvent(
          {
            userId,
            problemId: problem.id,
            status: ProgressStatus.SOLVED,
            solvedAt: existing.progressEvent?.solvedAt ?? new Date(),
          },
          tx
        );

        return this.submissionRepo.updateSubmissionCode(
          existing.id,
          {
            code,
            codeHash,
            language,
            runtime,
            memory,
            externalSubmissionId,
          },
          tx
        );
      });

      log.info(
        {
          userId,
          problemId: problem.id,
          submissionId: persistedSubmission.id,
          canonicalSlug,
          codeHash,
        },
        'Case C: Updated solution code persisted; reset LLM and GitHub sync statuses to PENDING'
      );
    }

    // 3. GitHub Config Gate
    const githubConfig = await this.githubConfigRepo.findActiveByUserId(userId);
    if (!githubConfig || !githubConfig.isConfigured) {
      persistedSubmission = await this.submissionRepo.updateGithubSyncStatus(
        persistedSubmission.id,
        GithubSyncStatus.SKIPPED,
        'GITHUB_CONFIG_MISSING'
      );

      log.info(
        {
          userId,
          submissionId: persistedSubmission.id,
          problemId: problem.id,
        },
        'GitHub config missing or disabled; set githubSyncStatus = SKIPPED'
      );

      return {
        case: decisionCase,
        submission: persistedSubmission,
        githubSyncQueued: false,
      };
    }

    // Enqueue githubSyncQueue with deterministic jobId (Bug #4 fix: pass persistedSubmission.id UUID)
    const deterministicJobId = `gh-sync-${persistedSubmission.id}-${codeHash.slice(0, 12)}`;
    await queueGithubSync(
      {
        submissionId: persistedSubmission.id,
        userId,
        problemId: problem.id,
        codeHash,
      },
      deterministicJobId
    );

    return {
      case: decisionCase,
      submission: persistedSubmission,
      githubSyncQueued: true,
    };
  }

  /**
   * Unified Retry Endpoint (`POST /api/v1/submissions/:problemId/retry-sync`):
   * Handles all 3 failure/skip modes automatically:
   * - Mode 1: Previously SKIPPED (user configured GitHub later)
   * - Mode 2: LLM Failed (`llmStatus === 'FAILED'`) -> resets both LLM and GitHub statuses
   * - Mode 3: GitHub Push Failed (`llmStatus === 'COMPLETED'`, `githubSyncStatus === 'FAILED'`) -> preserves LLM checkpoint, retries only Stage 2
   */
  async retrySubmissionSync(
    userId: string,
    problemId: string
  ): Promise<{
    status: 'queued';
    submissionId: string;
    problemId: string;
    mode: 'FULL_PIPELINE' | 'GITHUB_PUSH_ONLY';
  }> {
    const submission = await this.submissionRepo.findByUserAndProblem(userId, problemId);
    if (!submission) {
      throw new NotFoundError('No submission found for this problem');
    }

    const githubConfig = await this.githubConfigRepo.findActiveByUserId(userId);
    if (!githubConfig || !githubConfig.isConfigured) {
      throw new BadRequestError(
        'Please configure your GitHub repository in Settings before syncing.'
      );
    }

    const hasValidLlmCheckpoint =
      submission.llmStatus === LlmStatus.COMPLETED &&
      Boolean(submission.annotatedCode) &&
      Boolean(submission.progressEvent?.aiNotes);

    const resetLlm = !hasValidLlmCheckpoint;
    await this.submissionRepo.resetForRetry(submission.id, resetLlm);

    const retryJobId = `gh-sync-retry-${submission.id}-${Date.now()}`;
    await queueGithubSync(
      {
        submissionId: submission.id,
        userId,
        problemId: submission.problemId,
        codeHash: submission.codeHash,
      },
      retryJobId
    );

    return {
      status: 'queued',
      submissionId: submission.id,
      problemId: submission.problemId,
      mode: resetLlm ? 'FULL_PIPELINE' : 'GITHUB_PUSH_ONLY',
    };
  }

  /**
   * Fetch a user's submission for a specific problem.
   */
  async getSubmissionByProblem(
    userId: string,
    problemId: string
  ): Promise<SubmissionWithRelations> {
    const submission = await this.submissionRepo.findByUserAndProblem(userId, problemId);
    if (!submission) {
      throw new NotFoundError('Submission not found for this problem');
    }
    return submission;
  }

  /**
   * List all submissions for a user.
   */
  async getUserSubmissions(userId: string): Promise<SubmissionWithRelations[]> {
    return this.submissionRepo.findSubmissionsByUser(userId);
  }
}