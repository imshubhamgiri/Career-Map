import { z } from 'zod';

export const CreateApiKeySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Key name cannot be empty')
    .max(100, 'Key name must be 100 characters or fewer')
    .optional()
    .default('cos-leet Extension'),
  expiresInDays: z
    .number()
    .int('Expiration days must be an integer')
    .positive('Expiration days must be positive')
    .max(365, 'Expiration days cannot exceed 365 days')
    .optional(),
});

export type CreateApiKeyInputDto = z.input<typeof CreateApiKeySchema>;

export const UpsertGithubConfigSchema = z.object({
  githubUsername: z
    .string()
    .trim()
    .min(1, 'GitHub username is required')
    .max(100, 'GitHub username must be 100 characters or fewer'),
  githubRepo: z
    .string()
    .trim()
    .min(1, 'GitHub repository name is required')
    .max(255, 'GitHub repository name must be 255 characters or fewer'),
  githubBranch: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .default('main'),
  personalAccessToken: z
    .string()
    .trim()
    .min(10, 'Personal Access Token must be at least 10 characters')
    .max(500, 'Personal Access Token is too long'),
});

export type UpsertGithubConfigInputDto = z.input<typeof UpsertGithubConfigSchema>;

export const VerifyGithubConfigSchema = z.object({
  githubUsername: z.string().trim().min(1).max(100).optional(),
  githubRepo: z.string().trim().min(1).max(255).optional(),
  personalAccessToken: z.string().trim().min(10).optional(),
});

export type VerifyGithubConfigInputDto = z.input<typeof VerifyGithubConfigSchema>;
