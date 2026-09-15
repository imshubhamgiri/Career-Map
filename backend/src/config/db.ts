import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { env } from './env';

const connectionString = env.DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  logger.warn('DATABASE_URL is not set. Database operations will fail if executed.');
}

export const pool = new Pool({
  connectionString,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export default prisma;

