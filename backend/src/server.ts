import { env } from './config/env';
import app from './app';
import { logger } from './utils/logger';
import prisma from './config/db';
import { redisClient } from './config/redis';

const PORT = env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: env.NODE_ENV }, `Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown handling
function handleShutdown(signal: string) {
  logger.info({ signal }, `Received ${signal}. Gracefully terminating HTTP server...`);
  server.close(async () => {
    logger.info('HTTP server closed successfully.');
    try {
      await prisma.$disconnect();
      logger.info('PostgreSQL connection disconnected.');
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Error disconnecting PostgreSQL');
    }

    try {
      await redisClient.quit();
      logger.info('Redis connection closed.');
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Error closing Redis connection');
    }

    process.exit(0);
  });

  // Force close if connections take longer than 10 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing shutdown.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled Rejection detected');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception detected! Shutting down process...');
  process.exit(1);
});
