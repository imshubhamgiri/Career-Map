import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { AppError , BadRequestError, ConflictError, NotFoundError } from './appError';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const reqLogger = req.log || logger;

  let error: unknown = err;
  // 🕵️ Handle ALL Prisma Errors Globally in one single place
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation (e.g., Email already exists)
        const targetField = (err.meta?.target as string[])?.join(', ') || 'field';
        error = new ConflictError(`A record with this ${targetField} already exists.`);
        break;
        
      case 'P2025': // Record not found (e.g., trying to update a user that doesn't exist)
        error = new NotFoundError('The requested record could not be found.');
        break;
      case 'P2003': // Foreign key constraint violation
        error = new BadRequestError(`Database error: ${err.message}`);
        break;
      case 'P2001': // Record not found (e.g., trying to access a user that doesn't exist)
        error = new NotFoundError('The requested record could not be found.');
        break;
      default:
        error = new BadRequestError(`Database error: ${err.message}`);
    }
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      reqLogger.error({ err, path: req.path, method: req.method }, err.message);
    } else {
      reqLogger.warn({ statusCode: err.statusCode, path: req.path, method: req.method }, err.message);
    }

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      stack: err.stack,
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
    stack: err.stack,
  });
}

