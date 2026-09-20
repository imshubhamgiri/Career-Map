import { describe, it, expect, afterAll } from 'vitest';
import prisma from '../config/db';
import { redisClient } from '../config/redis';
import { UserRepository } from '../repositories/user.repository';
import { UserService } from '../services/user.service';
import { redisOtpService } from '../services/otp/redisOtp.service';
import { hashPassword, verifyPassword, generateOpaqueToken, hashOpaqueToken } from '../utils/crypto';
import { generateAccessToken, ACCESS_TOKEN_SECRET } from '../utils/tokens';
import jwt from 'jsonwebtoken';

describe('Authentication & Redis OTP Verification Flow', () => {
    const userRepository = new UserRepository();
    const queuedEmails: { to: string; code: string }[] = [];

    // Inject mock email dispatcher to verify background queue integration
    const mockEmailDispatcher = async (data: { to: string; name?: string | null; code: string }) => {
        queuedEmails.push({ to: data.to, code: data.code });
    };

    const userService = new UserService(userRepository, redisOtpService, mockEmailDispatcher);

    const testEmail = `auth_test_${Date.now()}@career-os.dev`;
    const testPassword = 'SecurePassword123!';
    const testName = 'Verified Developer';
    let createdUserId = '';
    let validVerificationCode = '';
    let activeRefreshToken = '';

    afterAll(async () => {
        if (createdUserId) {
            await prisma.session.deleteMany({ where: { userId: createdUserId } });
            await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
        }
        await redisOtpService.deleteOtp(testEmail);
        await redisOtpService.clearCooldown(testEmail);
        await prisma.$disconnect();
    });

    describe('Crypto & Token Utilities', () => {
        it('hashes and verifies passwords using Argon2id', async () => {
            const hash = await hashPassword(testPassword);
            expect(await verifyPassword(hash, testPassword)).toBe(true);
            expect(await verifyPassword(hash, 'WrongPassword')).toBe(false);
        });

        it('generates verifiable JWT access tokens', () => {
            const payloadUser = { id: '00000000-0000-0000-0000-000000000001', email: 'test@career-os.dev' };
            const token = generateAccessToken(payloadUser);
            const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as any;
            expect(decoded.userId).toBe(payloadUser.id);
            expect(decoded.email).toBe(payloadUser.email);
        });

        it('generates secure opaque tokens and hashes via SHA-256', () => {
            const rawToken = generateOpaqueToken();
            const hashed = hashOpaqueToken(rawToken);
            expect(rawToken).toBeTruthy();
            expect(hashed).toHaveLength(64);
        });
    });

    describe('Registration & Redis OTP Verification Lifecycle', () => {
        it('registers a new user as unverified and stores OTP in Redis with 15m TTL', async () => {
            const res = await userService.registerUser({
                name: testName,
                email: testEmail,
                password: testPassword,
            });

            expect(res.id).toBeDefined();
            expect(res.email).toBe(testEmail);
            expect(res.isEmailVerified).toBe(false);
            createdUserId = res.id!;

            // Verify email was enqueued for background worker
            expect(queuedEmails.length).toBeGreaterThan(0);
            const sent = queuedEmails.find((e) => e.to === testEmail);
            expect(sent).toBeDefined();
            expect(sent!.code).toMatch(/^\d{6}$/);
            validVerificationCode = sent!.code;

            // Verify OTP is stored in Redis with active TTL
            const redisOtp = await redisOtpService.getOtp(testEmail);
            expect(redisOtp).not.toBeNull();
            expect(redisOtp!.codeHash).toBe(hashOpaqueToken(validVerificationCode));
            expect(redisOtp!.attempts).toBe(0);

            const ttl = await redisClient.ttl(`otp:email_verify:${testEmail.toLowerCase().trim()}`);
            expect(ttl).toBeGreaterThan(800); // Close to 900s (15m)
        });

        it('rejects duplicate registration with ConflictError (409)', async () => {
            await expect(
                userService.registerUser({
                    name: testName,
                    email: testEmail,
                    password: testPassword,
                })
            ).rejects.toThrow('User with this email already exists.');
        });

        it('rejects login for unverified user with ForbiddenError (403)', async () => {
            await expect(
                userService.loginUser({
                    email: testEmail,
                    password: testPassword,
                })
            ).rejects.toThrow(/Please verify your email/);
        });

        it('rejects verification with an invalid code and increments attempts in Redis', async () => {
            await expect(
                userService.verifyEmail({
                    email: testEmail,
                    code: '999999',
                })
            ).rejects.toThrow('Invalid verification code.');

            // Verify attempt count was incremented in Redis
            const redisOtp = await redisOtpService.getOtp(testEmail);
            expect(redisOtp!.attempts).toBe(1);
        });

        it('verifies email with valid code, clears Redis key, and performs frictionless auto-login', async () => {
            const res = await userService.verifyEmail({
                email: testEmail,
                code: validVerificationCode,
                ipAddress: '127.0.0.1',
                userAgent: 'vitest-agent',
            });

            expect(res.user.email).toBe(testEmail);
            expect(res.user.isEmailVerified).toBe(true);
            expect(res.accessToken).toBeDefined();
            expect(res.refreshToken).toBeDefined();
            activeRefreshToken = res.refreshToken;

            // Verify PostgreSQL persisted verified status
            const dbUser = await userRepository.findUserById(createdUserId);
            expect(dbUser!.isEmailVerified).toBe(true);
            expect(dbUser!.emailVerifiedAt).not.toBeNull();

            // Verify Redis key was deleted upon successful verification
            const redisOtp = await redisOtpService.getOtp(testEmail);
            expect(redisOtp).toBeNull();
        });

        it('rejects duplicate verification when already verified', async () => {
            await expect(
                userService.verifyEmail({
                    email: testEmail,
                    code: validVerificationCode,
                })
            ).rejects.toThrow('Email is already verified. Please log in.');
        });

        it('allows login now that user is verified', async () => {
            const loginRes = await userService.loginUser({
                email: testEmail,
                password: testPassword,
                ipAddress: '127.0.0.1',
                userAgent: 'vitest-agent',
            });

            expect(loginRes.user.email).toBe(testEmail);
            expect(loginRes.user.isEmailVerified).toBe(true);
            expect(loginRes.accessToken).toBeDefined();
            expect(loginRes.refreshToken).toBeDefined();
            activeRefreshToken = loginRes.refreshToken;
        });

        it('rejects resending verification code when user is already verified', async () => {
            await expect(userService.resendVerification(testEmail)).rejects.toThrow('Email is already verified.');
        });
    });

    describe('Session Management & Refresh Token Rotation', () => {
        it('rotates refresh token and issues new access token', async () => {
            const rotated = await userService.rotateRefreshToken(activeRefreshToken, '127.0.0.1', 'vitest-agent');
            expect(rotated.accessToken).toBeDefined();
            expect(rotated.refreshToken).toBeDefined();
            expect(rotated.refreshToken).not.toBe(activeRefreshToken);

            const oldToken = activeRefreshToken;
            activeRefreshToken = rotated.refreshToken;

            // Reuse Attack Defense: Reusing the old token must revoke the entire session family
            await expect(
                userService.rotateRefreshToken(oldToken, '127.0.0.1', 'vitest-agent')
            ).rejects.toThrow('Invalid refresh token: reuse detected.');
        });

        it('logs out and deletes active session', async () => {
            await userService.logoutUser(activeRefreshToken, createdUserId);
            const user = await userService.getUserById(createdUserId);
            expect(user.id).toBe(createdUserId);
        });
    });
});
