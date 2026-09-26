import {Queue} from 'bullmq';
import { redisConnectionOptions } from '../config/redis';
import { logger } from '../utils/logger';

let log = logger.child({ service: 'GithubSyncQueue' });

export const GITHUB_SYNC_QUEUE_NAME = 'github-sync-queue';
export type GithubSyncJobName = 'sync-github-repo';

export const githubSyncQueue = new Queue<GithubSyncJobName>(GITHUB_SYNC_QUEUE_NAME, {
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
    }
  }
});

export async function queueGithubSync(): Promise<void> {
    await githubSyncQueue.add('sync-github-repo', 'sync-github-repo');
    log.info('Github sync job enqueued');
}