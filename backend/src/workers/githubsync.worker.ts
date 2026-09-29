import { Worker, Job } from 'bullmq';
import { logger } from '../utils/logger';
import {
  GITHUB_SYNC_QUEUE_NAME,
  GithubSyncJobData,
  GithubSyncJobName,
} from '../queues/githubSync.queue';
import { redisConnectionOptions } from '../config/redis';

const log = logger.child({ service: 'GithubSyncWorker' });

export function createGithubSyncWorker(): Worker<GithubSyncJobData, void, GithubSyncJobName> {
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

      // Here you would implement the logic to sync the github repo
      // First run LLM on solution and generate notes and then save the notes to the database

      // After saving the notes, push the code to github repo that is linked to the problem and user. You can use the submissionId from the job data to get the submission details from the database and then push the code to the github repo.
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