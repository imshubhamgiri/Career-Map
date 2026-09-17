import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import pinoHttp from 'pino-http';
import apiRoutes from './routes';
import { errorHandler } from './errors/errorHandler';
import { logger } from './utils/logger';
import prisma from './config/db';
import { attachAuthContext } from './middleware/auth.middleware';
import { COOKIE_SECRET } from './utils/tokens';

const app: Express = express();

// Middlewares
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req.headers['x-request-id'] as string) || crypto.randomUUID(),
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(COOKIE_SECRET));
app.use(attachAuthContext);


// Health check endpoint
app.get('/health',async (_req: Request, res: Response) => {
  const isDbConnected = await prisma.$queryRaw`SELECT 1`;
  res.status(isDbConnected ? 200 : 500).json({
     status: isDbConnected ? 'ok' : 'error', 
     message: isDbConnected ? 'Database is connected' : 'Database unreachable',
     uptime: process.uptime() 
    });
});

// Central API Routes
app.use('/api', apiRoutes);

// Centralized Error Handler (must be registered after routes)
app.use(errorHandler);

export default app;
