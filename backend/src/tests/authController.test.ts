import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { AuthService } from '../services/auth.service';
import { generateAccessToken } from '../utils/tokens';
import { ConflictError, ForbiddenError, NotFoundError } from '../errors/appError';

describe('Auth Endpoints Integration Tests (/api/v1/auth)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('rejects registration with invalid email or short password with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Dev', email: 'invalid-email', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('returns 201 and dispatches verification OTP when payload is valid', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        name: 'New Dev',
        email: 'newdev@career-os.dev',
        isEmailVerified: false,
      };

      vi.spyOn(AuthService.prototype, 'registerUser').mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'New Dev',
          email: 'newdev@career-os.dev',
          password: 'StrongPassword123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Please verify your email');
      expect(res.body.user.email).toBe('newdev@career-os.dev');
    });

    it('returns 409 Conflict when user email is already registered', async () => {
      vi.spyOn(AuthService.prototype, 'registerUser').mockRejectedValueOnce(
        new ConflictError('User with this email already exists.')
      );

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Existing Dev',
          email: 'existing@career-os.dev',
          password: 'StrongPassword123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User with this email already exists.');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('rejects login with 400 on malformed input', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'bad-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 Forbidden when user email is not yet verified', async () => {
      vi.spyOn(AuthService.prototype, 'loginUser').mockRejectedValueOnce(
        new ForbiddenError('Please verify your email before logging in.')
      );

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'unverified@career-os.dev',
          password: 'StrongPassword123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Please verify your email');
    });

    it('returns 200 with tokens and sets cookies on valid login', async () => {
      const mockLoginResponse = {
        user: {
          id: 'user-uuid-1',
          email: 'verified@career-os.dev',
          isEmailVerified: true,
        },
        accessToken: 'mock-access-token-jwt',
        refreshToken: 'mock-refresh-token-opaque',
      };

      vi.spyOn(AuthService.prototype, 'loginUser').mockResolvedValueOnce(mockLoginResponse);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'verified@career-os.dev',
          password: 'StrongPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBe('mock-access-token-jwt');
      expect(res.body.user.email).toBe('verified@career-os.dev');
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    it('rejects invalid 6-digit code format with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ email: 'dev@career-os.dev', code: '123' }); // Not 6 digits

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 and frictionless auto-login cookies on valid code', async () => {
      const mockVerified = {
        user: {
          id: 'user-uuid-1',
          email: 'dev@career-os.dev',
          isEmailVerified: true,
        },
        accessToken: 'verified-access-jwt',
        refreshToken: 'verified-refresh-opaque',
      };

      vi.spyOn(AuthService.prototype, 'verifyEmail').mockResolvedValueOnce(mockVerified);

      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ email: 'dev@career-os.dev', code: '654321' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Email verified successfully');
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/resend-verification', () => {
    it('returns 200 with confirmation message when cooldown is clear', async () => {
      vi.spyOn(AuthService.prototype, 'resendVerification').mockResolvedValueOnce({
        message: 'A fresh verification code has been dispatched to your email.',
      });

      const res = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'dev@career-os.dev' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('verification code has been dispatched');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('rejects with 401 when refresh token cookie is missing', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Refresh token missing');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('clears token cookies and returns 200', async () => {
      vi.spyOn(AuthService.prototype, 'logoutUser').mockResolvedValueOnce();

      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
    });

    it('returns 200 with current user profile when authenticated', async () => {
      const testUser = { id: 'user-uuid-1', email: 'me@career-os.dev' };
      const token = generateAccessToken(testUser);

      vi.spyOn(AuthService.prototype, 'getMe').mockResolvedValueOnce({
        id: testUser.id,
        email: testUser.email,
        name: 'Logged In Dev',
        isEmailVerified: true,
      } as any);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testUser.email);
    });
  });
});

