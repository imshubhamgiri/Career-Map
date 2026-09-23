import { QueueEvents } from 'bullmq';
import { INGESTION_QUEUE_NAME, ingestionQueue } from '../queues/ingestion.queue';
import { redisConnectionOptions } from '../config/redis';
import {logger} from '../utils/logger';
import { RoadmapService } from '../services/roadmap.service';
import { RoadmapStatus } from '@prisma/client';

let log = logger.child({ service: 'IngestionWorker' });

const queueEvents = new QueueEvents(INGESTION_QUEUE_NAME, {
  connection: redisConnectionOptions
});

const roadmapService = new RoadmapService();
queueEvents.on('failed', async ({ jobId, failedReason }) => {

  const job = await ingestionQueue.getJob(jobId);
  if (!job) return;

  //  Check if the job is truly finished trying
  // (e.g., it has tried 3 times out of 3 attempts)
  if (job.attemptsMade >= job.opts.attempts!) {
    const { roadmapId } = job.data;
    
    log.error({ roadmapId, jobId }, 'Job has exhausted all retry attempts and permanently failed');

    try {
      // 3. ONLY update the database to FAILED here
      await roadmapService.updateStatus(
        roadmapId,
        RoadmapStatus.FAILED,
        `Ingestion failed permanently after ${job.opts.attempts} attempts. Reason: ${failedReason}`
      );
    } catch (dbErr) {
      log.error({ roadmapId, dbErr }, 'Failed to update database status on final job failure');
    }
  } else {
    log.warn({ jobId, attemptsMade: job.attemptsMade }, 'Job failed/stalled but will be retried automatically by BullMQ');
  }
});
