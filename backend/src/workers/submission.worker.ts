import { Worker, Job } from 'bullmq';
import { logger } from '../utils/logger';
import {
  SUBMISSION_QUEUE_NAME,
  SubmissionJobData,
  SubmissionJobName,
} from '../queues/submission.queue';
import { redisConnectionOptions } from '../config/redis';
import { SubmissionService } from '../services/submission.service';

const log = logger.child({ service: 'SubmissionWorker' });

export function createSubmissionWorker(
  submissionService: SubmissionService = new SubmissionService()
)
: Worker<SubmissionJobData, void, SubmissionJobName> 
{
  const submissionWorker = new Worker<SubmissionJobData, void, SubmissionJobName>(
    SUBMISSION_QUEUE_NAME,
    async (job: Job<SubmissionJobData, void, SubmissionJobName>) => {
      const { userId, problemId, submissionId, titleSlug, codeHash } = job.data;
      log.info(
        {
          jobId: job.id,
          userId,
          problemId,
          submissionId,
          titleSlug,
          codeHash,
          attempt: job.attemptsMade + 1,
        },
        `Processing submission job: ${job.id}`
      );

      // Delegate canonical problem upsert, 3-Case Decision Matrix, and GitHub Config Gate to SubmissionService
      await submissionService.processSubmissionJob(job.data);
    },
    {
      connection: redisConnectionOptions,
      concurrency: 5, // Process up to 5 jobs concurrently
      maxStalledCount: 3, // Retry a job up to 3 times if it stalls
    }
  );

  submissionWorker.on('failed', (job, err) => {
    log.error(
      {
        jobId: job?.id,
        submissionId: job?.data.submissionId,
        problemId: job?.data.problemId,
        attempt: job?.attemptsMade,
        err: err.message,
      },
      `Submission job failed: ${job?.id}`
    );
  });

  submissionWorker.on('completed', (job) => {
    log.info(
      {
        jobId: job.id,
        submissionId: job.data.submissionId,
        problemId: job.data.problemId,
      },
      `Submission job completed: ${job.id}`
    );
  });

  submissionWorker.on('error', (err) => {
    log.error({ err }, 'Submission worker unexpected error');
  });

  return submissionWorker;
}