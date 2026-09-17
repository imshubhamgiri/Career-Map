import crypto from 'crypto';
import ms from 'ms';
import { UserRepository } from '../repositories/user.repository';
import { RegisterUserInput, UserResponse, LoginResponse } from '../types';
import { ConflictError, NotFoundError, UnauthorizedError, BadRequestError } from '../errors/appError';
import { generateOpaqueToken, hashOpaqueToken, hashPassword, verifyPassword } from '../utils/crypto';
import { generateAccessToken } from '../utils/tokens';

export class UserService {
    constructor(private userRepository: UserRepository) {}

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

        return {
            id: newUser.id,
            name: newUser.name || undefined,
            email: newUser.email,
        };
    }

    async loginUser({
        email,
        password,
        ipAddress,
        userAgent,
    }: {
        email: string;
        password: string;
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
