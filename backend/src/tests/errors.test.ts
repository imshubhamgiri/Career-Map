import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import {  z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  UnprocessableEntityError,
} from '../errors/appError';
import { errorHandler } from '../errors/errorHandler';

function createMockReqRes() {
  const req = {
    path: '/api/v1/test',
    method: 'POST',
    log: {
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  } as unknown as Request;

  const res = {
    statusCode: 200,
    status(code: number) {
      res.statusCode = code;
      return this;
    },
    json: vi.fn().mockReturnThis(),
  } as unknown as Response & { statusCode: number; json: any };

  const next = vi.fn();

  return { req, res, next };
}

describe('AppError Hierarchy', () => {
  it('instantiates AppError with default and custom values', () => {
    const error = new AppError('Something bad', 503, false);
    expect(error.message).toBe('Something bad');
    expect(error.statusCode).toBe(503);
    expect(error.isOperational).toBe(false);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof AppError).toBe(true);
  });

  it('instantiates NotFoundError with 404', () => {
    const error = new NotFoundError('Item not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Item not found');
    expect(error.isOperational).toBe(true);
  });

  it('instantiates UnauthorizedError with 401', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });

  it('instantiates ForbiddenError with 403', () => {
    const error = new ForbiddenError('Access forbidden');
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Access forbidden');
  });

  it('instantiates ConflictError with 409', () => {
    const error = new ConflictError('Resource already exists');
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Resource already exists');
  });

  it('instantiates BadRequestError with 400', () => {
    const error = new BadRequestError('Bad input');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad input');
  });

  it('instantiates UnprocessableEntityError with 422', () => {
    const error = new UnprocessableEntityError('Cannot process entity');
    expect(error.statusCode).toBe(422);
    expect(error.message).toBe('Cannot process entity');
  });
});

describe('Centralized errorHandler Middleware', () => {
  it('handles AppError with operational status and structured response', () => {
    const { req, res, next } = createMockReqRes();
    const error = new NotFoundError('User roadmap not found');

    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'User roadmap not found',
        error: 'User roadmap not found',
      })
    );
  });

  it('logs AppError >= 500 as error and < 500 as warn', () => {
    const { req: req500, res: res500, next: next500 } = createMockReqRes();
    const serverErr = new AppError('Server explosion', 500);
    errorHandler(serverErr, req500, res500, next500);
    expect((req500 as any).log.error).toHaveBeenCalled();

    const { req: req400, res: res400, next: next400 } = createMockReqRes();
    const badReqErr = new BadRequestError('Invalid input');
    errorHandler(badReqErr, req400, res400, next400);
    expect((req400 as any).log.warn).toHaveBeenCalled();
  });

  it('handles ZodError with 400 status and mapped field issues', () => {
    const { req, res, next } = createMockReqRes();
    const TestSchema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    const parsed = TestSchema.safeParse({ email: 'invalid-email', age: 10 });
    expect(parsed.success).toBe(false);
    const zodError = (parsed as z.ZodSafeParseError<any>).error;

    errorHandler(zodError, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
        error: expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'age' }),
        ]),
      })
    );
  });

  it('handles Prisma P2002 Unique Constraint violation as 409 Conflict', () => {
    const { req, res, next } = createMockReqRes();
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '7.10.0',
      meta: { target: ['email'] },
    });

    errorHandler(prismaError, req, res, next);

    expect(res.statusCode).toBe(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'A record with this email already exists.',
      })
    );
  });

  it('handles Prisma P2025 Record Not Found as 404 NotFoundError', () => {
    const { req, res, next } = createMockReqRes();
    const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.10.0',
    });

    errorHandler(prismaError, req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'The requested record could not be found.',
      })
    );
  });

  it('handles Prisma P2003 Foreign Key Constraint violation as 400 BadRequest', () => {
    const { req, res, next } = createMockReqRes();
    const prismaError = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
      code: 'P2003',
      clientVersion: '7.10.0',
    });

    errorHandler(prismaError, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Database error:'),
      })
    );
  });

  it('handles generic unhandled error as 500 Internal Server Error', () => {
    const { req, res, next } = createMockReqRes();
    const genericError = new Error('Unexpected crash in engine');

    errorHandler(genericError, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Unexpected crash in engine',
        error: 'Unexpected crash in engine',
      })
    );
  });
});

