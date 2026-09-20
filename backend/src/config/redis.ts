import Redis from 'ioredis';
import { ConnectionOptions } from 'bullmq';
import { env } from './env';
import { logger } from '../utils/logger';

const log = logger.child({ service: 'Redis' });

export const redisConnectionOptions: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
};

export const redisClient = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

redisClient.on('connect', () => {
  log.info('Redis client connected');
});

redisClient.on('error', (err) => {
  log.error({ err }, 'Redis connection error');
});

