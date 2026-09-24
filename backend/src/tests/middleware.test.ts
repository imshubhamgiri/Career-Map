import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authenticate, attachAuthContext } from '../middleware/auth.middleware';
import {
  validateBody,
  validateRegisterBody,
  validateLoginBody,
  validateUrl,
} from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';
import { generateAccessToken, ACCESS_TOKEN_SECRET } from '../utils/tokens';
import { AppError } from '../errors/appError';

function createMockReqRes(overrides?: Partial<Request>) {
  const req = {
    headers: {},
    cookies: {},
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as unknown as Request;

  const res = {
    statusCode: 200,
    status(code: number) {
      res.statusCode = code;
      return this;
    },
    json: vi.fn().mockReturnThis(),
  } as unknown as Response & { statusCode: number; json: any };

  const next = vi.fn() as unknown as NextFunction;

  return { req, res, next };
}

describe('Auth Middleware', () => {
  const testUser = { id: 'test-user-123', email: 'auth_middleware@career-os.dev' };
  const validToken = generateAccessToken(testUser);

  describe('authenticate()', () => {
    it('rejects requests when token is missing with 401', () => {
      const { req, res, next } = createMockReqRes();

      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access token missing',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('authenticates user from Authorization Bearer header', () => {
      const { req, res, next } = createMockReqRes({
        headers: { authorization: `Bearer ${validToken}` },
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(testUser.id);
      expect(req.user?.email).toBe(testUser.email);
    });

    it('authenticates user from cookies when header is absent', () => {
      const { req, res, next } = createMockReqRes({
        cookies: { access_token: validToken },
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user?.userId).toBe(testUser.id);
    });

    it('prioritizes Authorization header over cookies', () => {
      const otherUser = { id: 'other-user-999', email: 'other@career-os.dev' };
      const cookieToken = generateAccessToken(otherUser);

      const { req, res, next } = createMockReqRes({
        headers: { authorization: `Bearer ${validToken}` },
        cookies: { access_token: cookieToken },
      });

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user?.userId).toBe(testUser.id); // Header wins
    });

    it('rejects expired tokens with 401', () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        ACCESS_TOKEN_SECRET,
        { expiresIn: '-1s' }
      );

      const { req, res, next } = createMockReqRes({
        headers: { authorization: `Bearer ${expiredToken}` },
      });

      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access token expired or malformed',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects invalid signature tokens with 401', () => {
      const tamperedToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        'wrong-secret-key-123456789'
      );

      const { req, res, next } = createMockReqRes({
        headers: { authorization: `Bearer ${tamperedToken}` },
      });

      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access token expired or malformed',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('attachAuthContext()', () => {
    it('attaches user context if valid token present without blocking', () => {
      const { req, res, next } = createMockReqRes({
        headers: { authorization: `Bearer ${validToken}` },
      });

      attachAuthContext(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user?.userId).toBe(testUser.id);
    });

    it('silently continues if token is absent without error', () => {
      const { req, res, next } = createMockReqRes();

      attachAuthContext(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
    });

    it('silently continues if token is malformed without crashing', () => {
      const { req, res, next } = createMockReqRes({
        headers: { authorization: 'Bearer invalid-token-string' },
      });

      attachAuthContext(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
    });
  });
});

describe('Validation Middleware', () => {
  describe('validateBody()', () => {
    const TestSchema = z.object({
      title: z.string().min(3),
      count: z.number().int().positive(),
    });

    it('passes parsed and sanitized data to req.body when valid', () => {
      const { req, res, next } = createMockReqRes({
        body: { title: 'Valid Title', count: 5 },
      });

      validateBody(TestSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body).toEqual({ title: 'Valid Title', count: 5 });
    });

    it('forwards ZodError to next(err) when validation fails', () => {
      const { req, res, next } = createMockReqRes({
        body: { title: 'ab', count: -1 },
      });

      validateBody(TestSchema)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(z.ZodError));
    });
  });

  describe('Feature Body Validators', () => {
    it('validateRegisterBody accepts valid input and rejects invalid email/password', () => {
      const valid = createMockReqRes({
        body: {
          name: 'Developer',
          email: 'valid_dev@gmail.com',
          password: 'Password123!',
        },
      });
      validateRegisterBody(valid.req as any, valid.res, valid.next);
      expect(valid.next).toHaveBeenCalled();

      const invalid = createMockReqRes({
        body: {
          name: '',
          email: 'not-an-email',
          password: '123',
        },
      });
      validateRegisterBody(invalid.req as any, invalid.res, invalid.next);
      expect(invalid.res.statusCode).toBe(400);
      expect(invalid.res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation failed',
        })
      );
    });

    it('validateLoginBody accepts valid credentials and rejects missing password', () => {
      const valid = createMockReqRes({
        body: { email: 'dev@gmail.com', password: 'SecretPassword123' },
      });
      validateLoginBody(valid.req as any, valid.res, valid.next);
      expect(valid.next).toHaveBeenCalled();

      const invalid = createMockReqRes({
        body: { email: 'dev@gmail.com' },
      });
      validateLoginBody(invalid.req as any, invalid.res, invalid.next);
      expect(invalid.res.statusCode).toBe(400);
    });

    it('validateUrl accepts valid URL and rejects invalid scheme', () => {
      const valid = createMockReqRes({
        body: { url: 'https://leetcode.com/problem-list/top-interview-questions/' },
      });
      validateUrl(valid.req as any, valid.res, valid.next);
      expect(valid.next).toHaveBeenCalled();

      const invalid = createMockReqRes({
        body: { url: 'not-a-valid-http-url' },
      });
      validateUrl(invalid.req as any, invalid.res, invalid.next);
      expect(invalid.res.statusCode).toBe(400);
    });
  });
});

describe('Upload Middleware', () => {
  it('allows PDF file with application/pdf mimetype', () => {
    const fileFilter = (upload as any).fileFilter;
    const mockFile = {
      mimetype: 'application/pdf',
      originalname: 'roadmap.pdf',
    };
    const cb = vi.fn();

    fileFilter({} as any, mockFile, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('allows file ending with .pdf even if mimetype is generic octet-stream', () => {
    const fileFilter = (upload as any).fileFilter;
    const mockFile = {
      mimetype: 'application/octet-stream',
      originalname: 'study_plan.PDF',
    };
    const cb = vi.fn();

    fileFilter({} as any, mockFile, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('rejects non-PDF files with AppError 400', () => {
    const fileFilter = (upload as any).fileFilter;
    const mockFile = {
      mimetype: 'image/png',
      originalname: 'malware.png',
    };
    const cb = vi.fn();

    fileFilter({} as any, mockFile, cb);

    expect(cb).toHaveBeenCalledWith(expect.any(AppError));
    const passedError = cb.mock.calls[0][0];
    expect(passedError.statusCode).toBe(400);
    expect(passedError.message).toBe('Only PDF files are allowed');
  });
});

