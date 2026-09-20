import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME, SendVerificationEmailJobData } from '../queues/email.queue';
import { redisConnectionOptions } from '../config/redis';
import { emailService } from '../services/email/email.service';
import { logger } from '../utils/logger';

const log = logger.child({ service: 'EmailWorker' });

export function createEmailWorker(): Worker<SendVerificationEmailJobData> {
  const worker = new Worker<SendVerificationEmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<SendVerificationEmailJobData>) => {
      log.info({ jobId: job.id, to: job.data.to, attempt: job.attemptsMade + 1 }, 'Processing email job');
      await emailService.sendVerificationEmail(job.data.to, job.data.name, job.data.code);
    },
    {
      connection: redisConnectionOptions,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    log.info({ jobId: job.id, to: job.data.to }, 'Email job completed successfully');
  });

  worker.on('failed', (job, err) => {
    log.error(
      {
        jobId: job?.id,
        to: job?.data.to,
        attempt: job?.attemptsMade,
        err: err.message,
      },
      'Email job failed'
    );
  });

  worker.on('error', (err) => {
    log.error({ err }, 'Email worker unexpected error');
  });

  return worker;
}

