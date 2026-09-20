import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';
import { logger } from '../utils/logger';

const log = logger.child({ service: 'EmailQueue' });

export const EMAIL_QUEUE_NAME = 'email-queue';

export type EmailJobName = 'send-verification-email';

export interface SendVerificationEmailJobData {
  to: string;
  name?: string | null;
  code: string;
}

export const emailQueue = new Queue<SendVerificationEmailJobData, void, EmailJobName>(
  EMAIL_QUEUE_NAME,
  {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000, // 2s, 4s, 8s retries
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

emailQueue.on('error', (err) => {
  log.error({ err }, 'Email queue error');
});

/**
 * Push an email dispatch job into the background queue.
 * Returns in ~5ms without blocking HTTP execution.
 */
export async function queueVerificationEmail(data: SendVerificationEmailJobData): Promise<void> {
  await emailQueue.add('send-verification-email', data);
  log.info({ to: data.to }, 'Verification email job successfully enqueued');
}

