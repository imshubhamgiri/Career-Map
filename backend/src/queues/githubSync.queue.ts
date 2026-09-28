import {Queue} from 'bullmq';
import { redisConnectionOptions } from '../config/redis';
import { logger } from '../utils/logger';

const log = logger.child({ service: 'GithubSyncQueue' });

export const GITHUB_SYNC_QUEUE_NAME = 'github-sync-queue';
export type GithubSyncJobName = 'sync-github-repo';

export interface GithubSyncJobData {
  submissionId: string;
  userId: string;
  problemId: string;
  codeHash?: string;
}

export const githubSyncQueue = new Queue<GithubSyncJobData, void, GithubSyncJobName>(
  GITHUB_SYNC_QUEUE_NAME,
  {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s, 10s, 20s
      },
      removeOnComplete: {
        count: 5000,
      },
      removeOnFail: {
        count: 10000, // This means that the last 10k failed jobs will be kept in the queue, and older ones will be removed automatically. This is to prevent the queue from growing indefinitely and consuming too much memory.
      },
    },
  }
);

githubSyncQueue.on('error', (err) => {
  log.error({ err }, 'Github sync queue error');
});

export async function queueGithubSync(data: GithubSyncJobData, jobId?: string): Promise<void> {
  await githubSyncQueue.add('sync-github-repo', data, jobId ? { jobId } : undefined);
  log.info(
    { userId: data.userId, problemId: data.problemId, submissionId: data.submissionId },
    'Github sync job enqueued'
  );
}