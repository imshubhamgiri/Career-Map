import {Queue} from 'bullmq';
import {redisConnectionOptions} from '../config/redis';
import {logger} from '../utils/logger';

let log = logger.child({ service: 'SubmissionQueue' });



interface SubmissionJobData {
    userId: string;
    problemId: string;
    code: string;
}

const QUEUE_NAME = 'submission';
export type JOB_NAME = 'process-submission';

export const submissionQueue = new Queue<SubmissionJobData, void , JOB_NAME>(QUEUE_NAME, {
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
    }
  }
});


export async function queueSubmission(data: SubmissionJobData): Promise<void> {
    await submissionQueue.add('process-submission', data);
    log.info({ userId: data.userId, problemId: data.problemId }, 'Submission job enqueued');
}