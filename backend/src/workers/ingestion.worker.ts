import { Worker, Job } from 'bullmq';
import { INGESTION_QUEUE_NAME, ProcessRoadmapJobData } from '../queues/ingestion.queue';
import { redisConnectionOptions } from '../config/redis';
import { RoadmapService } from '../services/roadmap.service';
import { logger } from '../utils/logger';

const log = logger.child({ service: 'IngestionWorker' });

export function createIngestionWorker(roadmapService: RoadmapService = new RoadmapService()): Worker<ProcessRoadmapJobData> {
  const worker = new Worker<ProcessRoadmapJobData>(
    INGESTION_QUEUE_NAME,
    async (job: Job<ProcessRoadmapJobData>) => {
      const { roadmapId, url } = job.data;
      log.info({ jobId: job.id, roadmapId, url, attempt: job.attemptsMade + 1 }, 'Worker processing roadmap ingestion job');
      await roadmapService.processIngestion(roadmapId, url);
    },
    {
      connection: redisConnectionOptions,
      concurrency: 2, // Concurrency limit for heavy LLM / network scraping
    }
  );

  worker.on('completed', (job) => {
    log.info({ jobId: job.id, roadmapId: job.data.roadmapId }, 'Roadmap ingestion job completed successfully');
  });

  worker.on('failed', (job, err) => {
    log.error(
      {
        jobId: job?.id,
        roadmapId: job?.data.roadmapId,
        attempt: job?.attemptsMade,
        err: err.message,
      },
      'Roadmap ingestion job failed in worker'
    );
  });

  worker.on('error', (err) => {
    log.error({ err }, 'Ingestion worker unexpected error');
  });

  return worker;
}

