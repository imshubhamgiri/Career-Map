import prisma from '../config/db';
import { User, Session, Prisma } from '@prisma/client';
import { IUserInput } from '../types/index';

export class UserRepository {
    createUser(data: IUserInput): Promise<User> {
        return prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: data.passwordHash,
            },
        });
    }

    findUserByEmail(email: string): Promise<User | null> {
        return prisma.user.findFirst({
            where: {
                email,
            },
        });
    }

    findUserById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: {
                id,
            },
        });
    }

    markEmailVerified(userId: string): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: {
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
            },
        });
    }

    deleteSession(userId: string, hashedToken: string): Promise<Prisma.BatchPayload> {
        return prisma.session.deleteMany({
            where: {
                userId,
                hashedToken,
            },
        });
    }

    deleteSessionByHashedToken(hashedToken: string): Promise<Prisma.BatchPayload> {
        return prisma.session.deleteMany({
            where: {
                hashedToken,
            },
        });
    }

    createSession(data: {
        userId: string;
        tokenFamily: string;
        hashedToken: string;
        expiresAt: Date;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<Session> {
        return prisma.session.create({
            data,
        });
    }

    findSessionByHashedToken(hashedToken: string): Promise<(Session & { user: User }) | null> {
        return prisma.session.findUnique({
            where: {
                hashedToken,
            },
            include: { user: true },
        });
    }

    revokeSession(sessionId: string): Promise<Session> {
        return prisma.session.update({
            where: {
                id: sessionId,
            },
            data: {
                revoked: true,
            },
        });
    }

    revokeAllSessionsForUser(tokenFamily: string): Promise<Prisma.BatchPayload> {
        return prisma.session.updateMany({
            where: {
                tokenFamily,
            },
            data: {
                revoked: true,
            },
        });
    }
}
