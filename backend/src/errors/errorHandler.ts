import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { AppError } from './appError';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const reqLogger = req.log || logger;

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      reqLogger.error({ err, path: req.path, method: req.method }, err.message);
    } else {
      reqLogger.warn({ statusCode: err.statusCode, path: req.path, method: req.method }, err.message);
    }

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    reqLogger.warn({ path: req.path, method: req.method, issues: err.issues }, 'Validation failed');
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: z.treeifyError(err),
    });
    return;
  }

  reqLogger.error({ err, path: req.path, method: req.method }, 'Unhandled server error');
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
}

