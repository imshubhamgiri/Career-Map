import prisma from '../config/db';
import { GithubConfig, Prisma } from '@prisma/client';

export interface UpsertGithubConfigInput {
  userId: string;
  githubUsername: string;
  githubRepo: string;
  githubBranch?: string;
  accessTokenEncrypted: string;
  isConfigured?: boolean;
}

export class GithubConfigRepository {
  /**
   * Retrieve the 1:1 GitHub configuration record for a user.
   */
  findByUserId(
    userId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<GithubConfig | null> {
    return tx.githubConfig.findUnique({
      where: { userId },
    });
  }

  /**
   * Retrieve the GitHub configuration for a user only if `isConfigured === true`.
   */
  findActiveByUserId(
    userId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<GithubConfig | null> {
    return tx.githubConfig.findFirst({
      where: {
        userId,
        isConfigured: true,
      },
    });
  }

  /**
   * Create or update a user's GitHub repository and encrypted PAT configuration.
   */
  upsertGithubConfig(
    data: UpsertGithubConfigInput,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<GithubConfig> {
    const branch = data.githubBranch?.trim() || 'main';
    const isConfigured = data.isConfigured ?? true;

    return tx.githubConfig.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        githubUsername: data.githubUsername.trim(),
        githubRepo: data.githubRepo.trim(),
        githubBranch: branch,
        accessTokenEncrypted: data.accessTokenEncrypted,
        isConfigured,
      },
      update: {
        githubUsername: data.githubUsername.trim(),
        githubRepo: data.githubRepo.trim(),
        githubBranch: branch,
        accessTokenEncrypted: data.accessTokenEncrypted,
        isConfigured,
      },
    });
  }

  /**
   * Update `lastSyncedAt` timestamp after a successful Stage 2 GitHub Contents API push.
   */
  updateLastSyncedAt(
    userId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<GithubConfig> {
    return tx.githubConfig.update({
      where: { userId },
      data: { lastSyncedAt: new Date() },
    });
  }

  /**
   * Mark a user's GitHub configuration as disabled/unconfigured.
   */
  disableGithubConfig(
    userId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<GithubConfig> {
    return tx.githubConfig.update({
      where: { userId },
      data: { isConfigured: false },
    });
  }
}
