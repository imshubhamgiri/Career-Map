import crypto from 'crypto';
import ms from 'ms';
import { UserRepository } from '../repositories/user.repository';
import { RegisterUserInput, UserResponse, LoginResponse, VerifyEmailInput, LoginInput } from '../types';
import { ConflictError, NotFoundError, UnauthorizedError, BadRequestError, ForbiddenError } from '../errors/appError';
import { generateOpaqueToken, hashOpaqueToken, hashPassword, verifyPassword } from '../utils/crypto';
import { generateAccessToken } from '../utils/tokens';
import { redisOtpService as defaultRedisOtpService, RedisOtpService } from './otp/redisOtp.service';
import { queueVerificationEmail as defaultQueueVerificationEmail } from '../queues/email.queue';

export class AuthService {
    constructor(
        private userRepository: UserRepository,
        private otpService: RedisOtpService = defaultRedisOtpService,
        private emailDispatcher: (data: { to: string; name?: string | null; code: string }) => Promise<void> = defaultQueueVerificationEmail
    ) {}

    async registerUser(data: RegisterUserInput): Promise<UserResponse> {
        const existingUser = await this.userRepository.findUserByEmail(data.email);
        if (existingUser) {
            throw new ConflictError('User with this email already exists.');
        }
        const passwordHash = await hashPassword(data.password);
        const newUser = await this.userRepository.createUser({
            name: data.name,
            email: data.email,
            passwordHash,
        });

        // Generate secure 6-digit numeric OTP
        const code = crypto.randomInt(100000, 1000000).toString();
        const codeHash = hashOpaqueToken(code);

        // Store OTP in Redis with 15-minute (900s) TTL (Zero PostgreSQL bloat)
        await this.otpService.storeOtp(newUser.email, {
            userId: newUser.id,
            codeHash,
        }, 900);

        // Set 60-second cooldown lock
        await this.otpService.checkAndSetCooldown(newUser.email, 60);

        // Dispatch background email job via BullMQ (< 5ms queue add, worker handles sending)
        await this.emailDispatcher({
            to: newUser.email,
            name: newUser.name,
            code,
        });

        return {
            id: newUser.id,
            name: newUser.name || undefined,
            email: newUser.email,
            isEmailVerified: false,
        };
    }

    async verifyEmail({
        email,
        code,
        ipAddress,
        userAgent,
    }: VerifyEmailInput & {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<LoginResponse> {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.userRepository.findUserByEmail(normalizedEmail);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        if (user.isEmailVerified) {
            throw new BadRequestError('Email is already verified. Please log in.');
        }

        // Retrieve transient OTP state from Redis
        const storedOtp = await this.otpService.getOtp(normalizedEmail);
        if (!storedOtp) {
            throw new BadRequestError('Verification code has expired or is invalid. Please request a new code.');
        }

        // Enforce brute-force attempt limits (max 5 failed attempts invalidates the code)
        if (storedOtp.attempts >= 5) {
            await this.otpService.deleteOtp(normalizedEmail);
            throw new BadRequestError('Too many failed verification attempts. Please request a new code.');
        }

        // Increment attempt counter in Redis
        await this.otpService.incrementAttempts(normalizedEmail);

        // Verify cryptographic hash
        const inputHash = hashOpaqueToken(code);
        if (inputHash !== storedOtp.codeHash) {
            throw new BadRequestError('Invalid verification code.');
        }

        // Verification successful: evict from Redis
        await this.otpService.deleteOtp(normalizedEmail);
        await this.otpService.clearCooldown(normalizedEmail);

        // Persist verified status to PostgreSQL
        await this.userRepository.markEmailVerified(user.id);

        // Zero-Friction Auto-Login: Generate dual-token session immediately
        const accessToken = generateAccessToken({ id: user.id, email: user.email });
        const tokenFamily = crypto.randomUUID();
        const rawRefreshToken = generateOpaqueToken();
        const hashedToken = hashOpaqueToken(rawRefreshToken);

        await this.userRepository.createSession({
            userId: user.id,
            tokenFamily,
            hashedToken,
            ipAddress,
            userAgent,
            expiresAt: new Date(Date.now() + ms('7d')),
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name || undefined,
                isEmailVerified: true,
            },
            accessToken,
            refreshToken: rawRefreshToken,
        };
    }

    async resendVerification(email: string): Promise<{ message: string }> {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.userRepository.findUserByEmail(normalizedEmail);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        if (user.isEmailVerified) {
            throw new BadRequestError('Email is already verified. Please log in.');
        }

        // Check 60-second atomic cooldown in Redis
        const { allowed, remainingSeconds } = await this.otpService.checkAndSetCooldown(normalizedEmail, 60);
        if (!allowed) {
            throw new BadRequestError(`Please wait ${remainingSeconds} seconds before requesting a new code.`);
        }

        // Generate and persist fresh OTP in Redis
        const code = crypto.randomInt(100000, 1000000).toString();
        const codeHash = hashOpaqueToken(code);

        await this.otpService.storeOtp(normalizedEmail, {
            userId: user.id,
            codeHash,
        }, 900);

        // Enqueue background email job via BullMQ
        await this.emailDispatcher({
            to: user.email,
            name: user.name,
            code,
        });

        return { message: 'Verification code sent successfully.' };
    }

    async loginUser({
        email,
        password,
        ipAddress,
        userAgent,
    }: LoginInput & {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<LoginResponse> {
        const user = await this.userRepository.findUserByEmail(email);
        if (!user) {
            throw new UnauthorizedError('Invalid email or password.');
        }
        if (!user.passwordHash) {
            throw new BadRequestError('Account was registered with OAuth. Please login using OAuth.');
        }

        const isPasswordValid = await verifyPassword(user.passwordHash, password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid email or password.');
        }

        // Require email verification before allowing login
        if (!user.isEmailVerified) {
            throw new ForbiddenError('Please verify your email before logging in. If you need a new code, please request one via /resend-verification.');
        }

        const accessToken = generateAccessToken({ id: user.id, email: user.email });

        const tokenFamily = crypto.randomUUID();
        const rawRefreshToken = generateOpaqueToken();
        const hashedToken = hashOpaqueToken(rawRefreshToken);

        await this.userRepository.createSession({
            userId: user.id,
            tokenFamily,
            hashedToken,
            ipAddress,
            userAgent,
            expiresAt: new Date(Date.now() + ms('7d')),
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name || undefined,
                isEmailVerified: true,
            },
            accessToken,
            refreshToken: rawRefreshToken,
        };
    }

    async getMe(userId: string): Promise<UserResponse> {
        return this.getUserById(userId);
    }

    async getUserById(id: string): Promise<UserResponse> {
        const user = await this.userRepository.findUserById(id);
        if (!user) {
            throw new NotFoundError('User not found.');
        }
        return {
            id: user.id,
            name: user.name || undefined,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
        };
    }

    async logoutUser(rawRefreshToken: string, userId?: string): Promise<void> {
        if (!rawRefreshToken) return;
        const hashedToken = hashOpaqueToken(rawRefreshToken);
        if (userId) {
            await this.userRepository.deleteSession(userId, hashedToken);
        } else {
            await this.userRepository.deleteSessionByHashedToken(hashedToken);
        }
    }

    async rotateRefreshToken(
        rawRefreshToken: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<{ accessToken: string; refreshToken: string }> {
        if (!rawRefreshToken) {
            throw new UnauthorizedError('Refresh token is required.');
        }
        const hashedToken = hashOpaqueToken(rawRefreshToken);

        const session = await this.userRepository.findSessionByHashedToken(hashedToken);
        if (!session) {
            throw new UnauthorizedError('Invalid refresh token.');
        }

        if (session.revoked) {
            // Token reuse attack detection: revoke all sessions in this family
            await this.userRepository.revokeAllSessionsForUser(session.tokenFamily);
            throw new UnauthorizedError('Invalid refresh token: reuse detected.');
        }

        if (session.expiresAt < new Date()) {
            await this.userRepository.revokeSession(session.id);
            throw new UnauthorizedError('Refresh token has expired.');
        }

        // Revoke the old token
        await this.userRepository.revokeSession(session.id);

        // Issue new access token and rotate refresh token
        const newAccessToken = generateAccessToken({ id: session.user.id, email: session.user.email });
        const newRawRefreshToken = generateOpaqueToken();
        const newHashedToken = hashOpaqueToken(newRawRefreshToken);

        await this.userRepository.createSession({
            userId: session.user.id,
            tokenFamily: session.tokenFamily,
            hashedToken: newHashedToken,
            ipAddress: ipAddress || session.ipAddress || undefined,
            userAgent: userAgent || session.userAgent || undefined,
            expiresAt: new Date(Date.now() + ms('7d')),
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRawRefreshToken,
        };
    }
}

