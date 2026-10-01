import { UnrecoverableError } from 'bullmq';
import { generateText, Output } from 'ai';
import { createGoogle } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { GithubSyncStatus, LlmStatus } from '@prisma/client';
import {
  SubmissionRepository,
  SubmissionWithRelations,
} from '../repositories/submission.repository';
import { GithubConfigRepository } from '../repositories/githubConfig.repository';
import { GithubSyncJobData } from '../queues/githubSync.queue';
import {
  SubmissionAnalysisResult,
  SubmissionAnalysisSchema,
} from '../schemas/submission.schema';
import { getExtensionForLanguage } from './submission.service';
import { decryptSecret } from '../utils/crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const log = logger.child({ service: 'GithubSyncService' });

const geminiApiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
const googleProvider = geminiApiKey ? createGoogle({ apiKey: geminiApiKey }) : null;
const groqProvider = env.GROQ_API_KEY ? createGroq({ apiKey: env.GROQ_API_KEY }) : null;

const SUBMISSION_ANALYSIS_SYSTEM_PROMPT = `You are a Principal Algorithms Engineer and Technical Author for Career OS.
Given a user's accepted DSA problem solution, generate:
1. "annotatedCode": The user's exact working code enriched with clear, step-by-step inline comments explaining the core logic of each block. NEVER alter executable statements, variable names, or algorithm behavior.
2. "platformNotes": A concise, scannable Markdown revision guide formatted with these exact sections:
   ### 💡 Intuition
   ### 🛠️ Approach
   ### ⚡ Complexity
   ### 🎯 Key Takeaway
3. "timeComplexity": Big-O time complexity (e.g., "O(n log n)").
4. "spaceComplexity": Big-O space complexity (e.g., "O(n)").`;

export interface GithubPutFileResult {
  fileSha: string;
  commitSha: string;
}

export interface ProcessGithubSyncResult {
  status: 'SYNCED' | 'ABORTED_STALE' | 'SKIPPED_NO_CONFIG';
  submissionId: string;
  githubFilePath?: string;
  githubCommitSha?: string;
}

export class GithubSyncService {
  constructor(
    private submissionRepo: SubmissionRepository = new SubmissionRepository(),
    private githubConfigRepo: GithubConfigRepository = new GithubConfigRepository()
  ) {}

  /**
   * Worker 2 (`githubSyncWorker`) 2-Stage Checkpointed Pipeline:
   * - Pre-Flight: Stale-Job Guard (Layer 4 Idempotency)
   * - Stage 1: Gemini 2.5 Flash evaluation -> immediate atomic PostgreSQL checkpoint
   * - Stage 2: GitHub Contents API push with 409 SHA conflict recovery & 401/403 UnrecoverableError
   */
  async processGithubSyncJob(
    jobData: GithubSyncJobData
  ): Promise<ProcessGithubSyncResult> {
    const { submissionId, userId, codeHash } = jobData;

    // Pre-Flight: Load Submission + Problem + ProgressEvent
    let submission = await this.submissionRepo.findById(submissionId);

    // Stale-Job Guard (Layer 4 Idempotency)
    if (!submission || (codeHash && submission.codeHash !== codeHash)) {
      log.info(
        {
          submissionId,
          userId,
          jobCodeHash: codeHash,
          dbCodeHash: submission?.codeHash,
        },
        'Stale sync job superseded by newer submission; aborting'
      );
      return {
        status: 'ABORTED_STALE',
        submissionId,
      };
    }

    // =========================================================================
    // STAGE 1: LLM Evaluation (Checkpointed Before GitHub Push)
    // =========================================================================
    const hasCompletedLlmCheckpoint =
      submission.llmStatus === LlmStatus.COMPLETED &&
      Boolean(submission.annotatedCode) &&
      Boolean(submission.progressEvent?.aiNotes);

    if (hasCompletedLlmCheckpoint) {
      log.info(
        { submissionId, problemId: submission.problemId },
        'Stage 1 LLM checkpoint already present; skipping LLM call'
      );
    } else {
      await this.submissionRepo.updateLlmStatus(submission.id, LlmStatus.PROCESSING);

      try {
        const analysis = await this.generateSubmissionAnalysis(submission);

        // CRITICAL POSTGRESQL CHECKPOINT: Atomically persist progress_events.ai_notes + submissions.annotated_code
        submission = await this.submissionRepo.saveLlmCheckpoint(
          submission.id,
          submission.userId,
          submission.problemId,
          analysis
        );

        log.info(
          {
            submissionId: submission.id,
            problemId: submission.problemId,
            timeComplexity: analysis.timeComplexity,
            spaceComplexity: analysis.spaceComplexity,
          },
          'Stage 1 LLM evaluation checkpointed to PostgreSQL'
        );
      } catch (err: any) {
        const errorMsg = `LLM_GENERATION_FAILED: ${err?.message || 'Unknown LLM error'}`;
        log.error(
          { submissionId: submission.id, err: err?.message },
          'Stage 1 LLM generation failed'
        );

        await this.submissionRepo.updateLlmStatus(
          submission.id,
          LlmStatus.FAILED,
          errorMsg
        );
        await this.submissionRepo.updateGithubSyncStatus(
          submission.id,
          GithubSyncStatus.FAILED,
          errorMsg
        );

        throw err;
      }
    }

    // =========================================================================
    // STAGE 2: GitHub Contents API Push
    // =========================================================================
    const githubConfig = await this.githubConfigRepo.findActiveByUserId(submission.userId);
    if (!githubConfig || !githubConfig.isConfigured) {
      await this.submissionRepo.updateGithubSyncStatus(
        submission.id,
        GithubSyncStatus.SKIPPED,
        'GITHUB_CONFIG_MISSING'
      );
      log.info(
        { submissionId: submission.id, userId: submission.userId },
        'GitHub config missing during Stage 2; marked SKIPPED'
      );
      return {
        status: 'SKIPPED_NO_CONFIG',
        submissionId: submission.id,
      };
    }

    await this.submissionRepo.updateGithubSyncStatus(
      submission.id,
      GithubSyncStatus.PROCESSING,
      null
    );

    let accessToken: string;
    try { 
      accessToken = decryptSecret(githubConfig.accessTokenEncrypted);
    } catch (err: any) {
      const decryptErr = 'GITHUB_AUTH_INVALID: Failed to decrypt GitHub Personal Access Token';
      await this.submissionRepo.updateGithubSyncStatus(
        submission.id,
        GithubSyncStatus.FAILED,
        decryptErr
      );
      throw new UnrecoverableError(decryptErr);
    }

    const difficultyFolder = (submission.problem.difficulty || 'UNKNOWN').toLowerCase();
    const slug = submission.problem.canonicalSlug;
    const ext = getExtensionForLanguage(submission.language);
    const folderPath = `solutions/${difficultyFolder}/${slug}`;
    const codeFilePath = `${folderPath}/solution${ext}`;
    const readmeFilePath = `${folderPath}/README.md`;

    const codeFileContent = this.formatAnnotatedSolutionFile(submission, ext);
    const readmeFileContent = this.formatProblemReadmeFile(submission);

    const owner = githubConfig.githubUsername;
    const repo = githubConfig.githubRepo;
    const branch = githubConfig.githubBranch || 'main';

    try {
      // 1. Push solution.<ext>
      const codeCommitMessage = `feat(${slug}): sync ${submission.language} solution [${
        submission.timeComplexity || 'Accepted'
      }]`;
      const codePushResult = await this.pushFileToGithub({
        owner,
        repo,
        branch,
        filePath: codeFilePath,
        content: codeFileContent,
        commitMessage: codeCommitMessage,
        accessToken,
        knownSha: submission.githubFileSha ?? undefined,
      });

      // 2. Push README.md with AI revision notes
      const readmeCommitMessage = `docs(${slug}): update AI revision notes`;
      await this.pushFileToGithub({
        owner,
        repo,
        branch,
        filePath: readmeFilePath,
        content: readmeFileContent,
        commitMessage: readmeCommitMessage,
        accessToken,
      });

      // 3. Finalize SYNCED state in PostgreSQL
      await this.submissionRepo.markGithubSynced(submission.id, {
        githubRepo: `${owner}/${repo}`,
        githubFilePath: codeFilePath,
        githubFileSha: codePushResult.fileSha,
        githubCommitSha: codePushResult.commitSha,
      });

      await this.githubConfigRepo.updateLastSyncedAt(submission.userId);

      log.info(
        {
          submissionId: submission.id,
          repo: `${owner}/${repo}`,
          githubFilePath: codeFilePath,
          commitSha: codePushResult.commitSha,
        },
        'Stage 2 GitHub push completed successfully'
      );

      return {
        status: 'SYNCED',
        submissionId: submission.id,
        githubFilePath: codeFilePath,
        githubCommitSha: codePushResult.commitSha,
      };
    } catch (err: any) {
      const syncErrorMessage =
        err instanceof UnrecoverableError
          ? err.message
          : `GITHUB_PUSH_FAILED: ${err?.message || 'Unknown GitHub API error'}`;

      await this.submissionRepo.updateGithubSyncStatus(
        submission.id,
        GithubSyncStatus.FAILED,
        syncErrorMessage
      );
      throw err;
    }
  }

  /**
   * Executes structured JSON generation against `gemini-2.5-flash` (with Groq fallback if needed).
   */
  async generateSubmissionAnalysis(
    submission: SubmissionWithRelations
  ): Promise<SubmissionAnalysisResult> {
    const prompt = [
      `Problem Title: ${submission.problem.title}`,
      `Canonical Slug: ${submission.problem.canonicalSlug}`,
      `Difficulty: ${submission.problem.difficulty}`,
      `Language: ${submission.language}`,
      submission.runtime ? `Runtime: ${submission.runtime}` : '',
      submission.memory ? `Memory: ${submission.memory}` : '',
      `\nUser's Accepted Solution Code:\n\`\`\`${submission.language}\n${submission.code}\n\`\`\``,
    ]
      .filter(Boolean)
      .join('\n');

    if (googleProvider) {
      try {
        const { output } = await generateText({
          model: googleProvider('gemini-2.5-flash'),
          output: Output.object({
            schema: SubmissionAnalysisSchema,
          }),
          system: SUBMISSION_ANALYSIS_SYSTEM_PROMPT,
          prompt,
        });
        return output;
      } catch (err: any) {
        log.warn(
          { submissionId: submission.id, err: err?.message },
          'Gemini 2.5 Flash call failed; attempting Groq fallback if configured'
        );
        if (!groqProvider) throw err;
      }
    }

    if (groqProvider) {
      const { output } = await generateText({
        model: groqProvider('openai/gpt-oss-120b'),
        output: Output.object({
          schema: SubmissionAnalysisSchema,
        }),
        system: SUBMISSION_ANALYSIS_SYSTEM_PROMPT,
        prompt,
      });
      return output;
    }

    throw new Error('No LLM provider (GEMINI_API_KEY / GOOGLE_API_KEY / GROQ_API_KEY) configured');
  }

  /**
   * Pushes a file to GitHub via the Contents API (`PUT /repos/{owner}/{repo}/contents/{path}`).
   * Automatically resolves SHA conflicts (`409` / `422`) and throws `UnrecoverableError` on `401` / `403`.
   */
  async pushFileToGithub(params: {
    owner: string;
    repo: string;
    branch: string;
    filePath: string;
    content: string;
    commitMessage: string;
    accessToken: string;
    knownSha?: string;
  }): Promise<GithubPutFileResult> {
    const { owner, repo, branch, filePath, content, commitMessage, accessToken } = params;
    let fileSha = params.knownSha;

    // If no SHA is known yet, check if the file already exists on the target branch
    if (!fileSha) {
      fileSha = (await this.fetchExistingFileSha(owner, repo, branch, filePath, accessToken)) ?? undefined;
    }

    const executePut = async (sha?: string): Promise<Response> => {
      const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
        repo
      )}/contents/${filePath}`;

      const body: Record<string, string> = {
        message: commitMessage,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch,
      };
      if (sha) {
        body.sha = sha;
      }

      return fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2026-03-10',
          'User-Agent': 'Career-OS-Backend',
        },
        body: JSON.stringify(body),
      });
    };

    let response = await executePut(fileSha);

    // SHA Conflict Recovery: If 409 Conflict or 422 Unprocessable Entity, fetch latest SHA and retry once
    if (response.status === 409 || response.status === 422) {
      log.warn(
        { owner, repo, filePath, status: response.status },
        'GitHub SHA conflict detected; fetching latest file SHA and retrying PUT once'
      );
      const latestSha = await this.fetchExistingFileSha(
        owner,
        repo,
        branch,
        filePath,
        accessToken
      );
      response = await executePut(latestSha ?? undefined);
    }

    // Auth Failure Handling (401 Unauthorized / 403 Forbidden bad credentials)
    if (response.status === 401 || response.status === 403) {
      const errBody = await response.text().catch(() => '');
      const authErrorMsg =
        'GITHUB_AUTH_INVALID: Personal Access Token expired, revoked, or lacks repo write permissions';
      log.error(
        { owner, repo, status: response.status, errBody },
        authErrorMsg
      );
      throw new UnrecoverableError(authErrorMsg);
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`GitHub API responded with ${response.status}: ${errBody}`);
    }

    const json = (await response.json()) as {
      content?: { sha?: string };
      commit?: { sha?: string };
    };

    return {
      fileSha: json.content?.sha || '',
      commitSha: json.commit?.sha || '',
    };
  }

  /**
   * Fetches the current blob SHA of a file in a GitHub repository (`GET /repos/{owner}/{repo}/contents/{path}`).
   * Returns `null` if the file does not exist (`404`).
   */
  private async fetchExistingFileSha(
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    accessToken: string
  ): Promise<string | null> {
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/contents/${filePath}?ref=${encodeURIComponent(branch)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Career-OS-Backend',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnrecoverableError(
        'GITHUB_AUTH_INVALID: Personal Access Token expired or revoked'
      );
    }

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { sha?: string };
    return data.sha ?? null;
  }

  /**
   * Formats the annotated code file with a clean metadata banner header comment.
   */
  private formatAnnotatedSolutionFile(
    submission: SubmissionWithRelations,
    ext: string
  ): string {
    const useHashComment = ['.py', '.rb', '.ex'].includes(ext);
    const useDashComment = ext === '.sql';
    const prefix = useHashComment ? '#' : useDashComment ? '--' : '//';

    const url =
      submission.problem.externalUrl ||
      `https://leetcode.com/problems/${submission.problem.canonicalSlug}/`;

    const headerLines = [
      `${prefix} ============================================================================`,
      `${prefix} Problem: ${submission.problem.title} (${submission.problem.difficulty})`,
      `${prefix} URL: ${url}`,
      `${prefix} Language: ${submission.language}`,
      submission.runtime ? `${prefix} Runtime: ${submission.runtime}` : null,
      submission.memory ? `${prefix} Memory: ${submission.memory}` : null,
      submission.timeComplexity
        ? `${prefix} Time Complexity: ${submission.timeComplexity}`
        : null,
      submission.spaceComplexity
        ? `${prefix} Space Complexity: ${submission.spaceComplexity}`
        : null,
      `${prefix} Synced by: Career OS (cos-leet)`,
      `${prefix} ============================================================================`,
    ].filter(Boolean);

    const codeBody = submission.annotatedCode || submission.code;
    return `${headerLines.join('\n')}\n\n${codeBody}\n`;
  }

  /**
   * Formats the companion `README.md` file containing problem metadata and AI revision notes.
   */
  private formatProblemReadmeFile(submission: SubmissionWithRelations): string {
    const url =
      submission.problem.externalUrl ||
      `https://leetcode.com/problems/${submission.problem.canonicalSlug}/`;

    const metaTable = [
      `# ${submission.problem.title}`,
      '',
      `| Attribute | Value |`,
      `| :--- | :--- |`,
      `| **Difficulty** | \`${submission.problem.difficulty}\` |`,
      `| **Language** | \`${submission.language}\` |`,
      `| **Time Complexity** | \`${submission.timeComplexity || 'N/A'}\` |`,
      `| **Space Complexity** | \`${submission.spaceComplexity || 'N/A'}\` |`,
      submission.runtime ? `| **Runtime** | \`${submission.runtime}\` |` : null,
      submission.memory ? `| **Memory** | \`${submission.memory}\` |` : null,
      `| **Problem Link** | [LeetCode — ${submission.problem.title}](${url}) |`,
      '',
      '---',
      '',
      submission.progressEvent?.aiNotes || '_No revision notes generated._',
      '',
    ].filter((line) => line !== null);

    return metaTable.join('\n');
  }
}
