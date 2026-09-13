import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import pinoHttp from 'pino-http';
import apiRoutes from './routes';
import { errorHandler } from './errors/errorHandler';
import { logger } from './utils/logger';

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Central API Routes
app.use('/api', apiRoutes);

// Centralized Error Handler (must be registered after routes)
app.use(errorHandler);

export default app;
