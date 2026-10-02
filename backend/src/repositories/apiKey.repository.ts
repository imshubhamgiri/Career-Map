import prisma from '../config/db';
import { ApiKey, Prisma } from '@prisma/client';

export interface CreateApiKeyInput {
  userId: string;
  name?: string;
  keyHash: string;
  keyPrefix: string;
  expiresAt?: Date | null;
}

export class ApiKeyRepository {
  /**
   * Create a new API key record storing only the SHA-256 `keyHash` and display `keyPrefix`.
   */
  createApiKey(
    data: CreateApiKeyInput,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<ApiKey> {
    return tx.apiKey.create({
      data: {
        userId: data.userId,
        name: data.name ?? 'cos-leet Extension',
        keyHash: data.keyHash,
        keyPrefix: data.keyPrefix,
        expiresAt: data.expiresAt ?? null,
      },
    });
  }

  /**
   * Find an active (non-revoked, non-expired) API key by its SHA-256 `keyHash`.
   */
  findActiveByHash(
    keyHash: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<ApiKey | null> {
    const now = new Date();
    return tx.apiKey.findFirst({
      where: {
        keyHash,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
  }

  /**
   * Asynchronously touch `lastUsedAt` when an API key authenticates a request.
   */
  updateLastUsed(
    id: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<ApiKey> {
    return tx.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * List all API keys belonging to a user.
   */
  findAllByUserId(
    userId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<ApiKey[]> {
    return tx.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find an API key by ID belonging to a specific user.
   */
  findUserKeyById(
    id: string,
    userId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<ApiKey | null> {
    return tx.apiKey.findFirst({
      where: { id, userId },
    });
  }

  /**
   * Soft-revoke an API key by ID.
   */
  revokeApiKey(
    id: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<ApiKey> {
    return tx.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
