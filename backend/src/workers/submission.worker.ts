import {Worker} from 'bullmq';
import { logger } from '../utils/logger';
import { githubSyncQueue } from '../queues/githubSync.queue';
import { redisConnectionOptions } from '../config/redis';


let log = logger.child({ service: 'SubmissionWorker' });

export const submissionWorker = new Worker('submission', async (job) => {
    log.info(`Processing submission job: ${job.id}`);

    //Save the submission to the database
    // Here you would implement the logic to save the submission to the database


    //After saving the submission, queue the job for github sync and llm processing with job data and submission id

    await githubSyncQueue.add('sync-github-repo', { ...job.data, submissionId: job.id });
},{
    connection:redisConnectionOptions,
    concurrency: 5, // Process one job at a time
    maxStalledCount: 3, // Retry a job up to 3 times if it stalls
});