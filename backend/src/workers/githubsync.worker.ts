import { Worker, Job } from 'bullmq';
import { logger } from '../utils/logger';
import {
  GITHUB_SYNC_QUEUE_NAME,
  GithubSyncJobData,
  GithubSyncJobName,
} from '../queues/githubSync.queue';
import { redisConnectionOptions } from '../config/redis';
import { GithubSyncService } from '../services/githubSync.service';

const log = logger.child({ service: 'GithubSyncWorker' });

export function createGithubSyncWorker(
  githubSyncService: GithubSyncService = new GithubSyncService()
): Worker<GithubSyncJobData, void, GithubSyncJobName> {
  const githubSyncWorker = new Worker<GithubSyncJobData, void, GithubSyncJobName>(
    GITHUB_SYNC_QUEUE_NAME,
    async (job: Job<GithubSyncJobData, void, GithubSyncJobName>) => {
      const { submissionId, userId, problemId, codeHash } = job.data;
      log.info(
        {
          jobId: job.id,
          submissionId,
          userId,
          problemId,
          codeHash,
          attempt: job.attemptsMade + 1,
        },
        `Processing github sync job: ${job.id}`
      );

      // Delegate Stage 1 (LLM evaluation + PostgreSQL checkpoint) & Stage 2 (GitHub Contents API push) to GithubSyncService
      await githubSyncService.processGithubSyncJob(job.data);
    },
    {
      connection: redisConnectionOptions,
      concurrency: 3,
      maxStalledCount: 3, // Retry a job up to 3 times if it stalls
    }
  );

  githubSyncWorker.on('failed', (job, err) => {
    log.error(
      {
        jobId: job?.id,
        submissionId: job?.data.submissionId,
        problemId: job?.data.problemId,
        attempt: job?.attemptsMade,
        err: err.message,
      },
      `Github sync job failed: ${job?.id}`
    );
  });

  githubSyncWorker.on('completed', (job) => {
    log.info(
      {
        jobId: job.id,
        submissionId: job.data.submissionId,
        problemId: job.data.problemId,
      },
      `Github sync job completed: ${job.id}`
    );
  });

  githubSyncWorker.on('error', (err) => {
    log.error({ err }, 'Github sync worker unexpected error');
  });

  return githubSyncWorker;
}