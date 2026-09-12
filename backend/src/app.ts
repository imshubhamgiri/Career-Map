import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { errorHandler } from './errors/errorHandler';

const app: Express = express();

// Middlewares
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
