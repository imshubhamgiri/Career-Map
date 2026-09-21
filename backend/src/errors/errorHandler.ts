import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { AppError, BadRequestError, ConflictError, NotFoundError } from './appError';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';
import { ErrorResponse } from '../types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
): void {
  const reqLogger = req.log || logger;

  let error: Error = err;

  // 🕵️ Handle ALL Prisma Errors Globally in one single place
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation (e.g., Email already exists)
        const targetField = (err.meta?.target as string[])?.join(', ') || 'field';
        error = new ConflictError(`A record with this ${targetField} already exists.`);
        break;
      }
      case 'P2025':
      case 'P2001':
        // Record not found
        error = new NotFoundError('The requested record could not be found.');
        break;
      case 'P2003':
        // Foreign key constraint violation
        error = new BadRequestError(`Database error: ${err.message}`);
        break;
      default:
        error = new BadRequestError(`Database error: ${err.message}`);
    }
  }

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      reqLogger.error({ err: error, path: req.path, method: req.method }, error.message);
    } else {
      reqLogger.warn({ statusCode: error.statusCode, path: req.path, method: req.method }, error.message);
    }

    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: error.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
    });
    return;
  }

  if (err instanceof ZodError) {
    reqLogger.warn({ path: req.path, method: req.method, issues: err.issues }, 'Validation failed');
    const fieldErrors = err.issues.map((issue) => ({
      field: String(issue.path[0] ?? ''),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: fieldErrors,
      details: z.treeifyError(err),
    });
    return;
  }

  reqLogger.error({ err, path: req.path, method: req.method }, 'Unhandled server error');
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
