import {Worker} from 'bullmq';
import { logger } from '../utils/logger';
import { GITHUB_SYNC_QUEUE_NAME} from '../queues/githubSync.queue';
import { redisConnectionOptions } from '../config/redis';

let log = logger.child({ service: 'GithubSyncWorker' });

export const githubSyncWorker = new Worker(GITHUB_SYNC_QUEUE_NAME, async (job) => {
    log.info(`Processing github sync job: ${job.id}`);

    // Here you would implement the logic to sync the github repo
    //First run LLM on solution and generate notes and then save the notes to the database


    //After saving the notes, push the code to github repo that is linked to the problem and user. You can use the submissionId from the job data to get the submission details from the database and then push the code to the github repo.
},{
    connection:redisConnectionOptions,
    concurrency: 5, // Process one job at a time
    maxStalledCount: 3, // Retry a job up to 3 times if it stalls
});