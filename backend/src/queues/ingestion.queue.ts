import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';
import { logger } from '../utils/logger';

const log = logger.child({ service: 'IngestionQueue' });

export const INGESTION_QUEUE_NAME = 'ingestion-queue';

export type IngestionJobName = 'process-roadmap';

export interface ProcessRoadmapJobData {
  roadmapId: string;
  url: string;
  userId: string;
}

export const ingestionQueue = new Queue<ProcessRoadmapJobData, void, IngestionJobName>(
  INGESTION_QUEUE_NAME,
  {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s, 10s, 20s
      },
      removeOnComplete: {
        count: 1000,
      },
      removeOnFail: {
        count: 5000,
      },
    },
  }
);

ingestionQueue.on('error', (err) => {
  log.error({ err }, 'Ingestion queue error');
});

/**
 * Enqueue a roadmap parsing and extraction job for background worker processing.
 * Returns immediately without blocking the Express HTTP request.
 */
export async function queueRoadmapIngestion(data: ProcessRoadmapJobData): Promise<void> {
  await ingestionQueue.add('process-roadmap', data);
  log.info({ roadmapId: data.roadmapId, url: data.url }, 'Roadmap ingestion job enqueued');
}

