import { createEmailWorker } from './email.worker';
import { createIngestionWorker } from './ingestion.worker';
import { logger } from '../utils/logger';

const log = logger.child({ service: 'BackgroundWorkerPool' });

async function startWorkers() {
  log.info('Starting Career OS Background Worker Pool...');

  const emailWorker = createEmailWorker();
  log.info('✓ Email Worker listening on queue: email-queue');

  const ingestionWorker = createIngestionWorker();
  log.info('✓ Ingestion Worker listening on queue: ingestion-queue');

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    log.info({ signal }, 'Received termination signal, closing workers gracefully...');
    try {
      await Promise.all([
        emailWorker.close(),
        ingestionWorker.close(),
      ]);
      log.info('All background workers closed cleanly');
      process.exit(0);
    } catch (err) {
      log.error({ err }, 'Error during worker shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startWorkers().catch((err) => {
  log.fatal({ err }, 'Failed to start background worker pool');
  process.exit(1);
});

