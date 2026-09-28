import {Queue} from 'bullmq';
import {redisConnectionOptions} from '../config/redis';
import {logger} from '../utils/logger';

const log = logger.child({ service: 'SubmissionQueue' });

export const SUBMISSION_QUEUE_NAME = 'submission-queue';
export type SubmissionJobName = 'process-submission';

export interface SubmissionJobData {
  userId: string;
  submissionId: number | string;
  problemId: string;
  titleSlug: string;
  questionTitle: string;
  difficulty: string;
  code: string;
  codeHash?: string;
  language: string;
  status: string;
  runtime: string | number;
  memory: string | number;
  timestamp: number;
}

export const submissionQueue = new Queue<SubmissionJobData, void, SubmissionJobName>(
  SUBMISSION_QUEUE_NAME,
  {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s, 10s, 20s
      },
      removeOnComplete: {
        count: 5000, //This means that the last 5k completed jobs will be kept in the queue, and older ones will be removed automatically. This is to prevent the queue from growing indefinitely and consuming too much memory.
      },
      removeOnFail: {
        count: 10000, // 10k
      },
    },
  }
);

submissionQueue.on('error', (err) => {
  log.error({ err }, 'Submission queue error');
});

export async function queueSubmission(data: SubmissionJobData): Promise<void> {
  await submissionQueue.add('process-submission', data);
  log.info(
    { userId: data.userId, problemId: data.problemId, submissionId: data.submissionId },
    'Submission job enqueued'
  );
}