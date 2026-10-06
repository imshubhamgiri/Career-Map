export interface ApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
 }

 export interface CreateApiKeyResult {
  apiKey: ApiKeyResponse;
  rawKey: string;
 }

export interface GithubConfig {
  isConfigured: boolean;
  githubUsername?: string;
  githubRepo?: string;
  githubBranch?: string;
  lastSyncedAt?: string | null;
  updatedAt?: string;
}

export interface GithubConfigForm {
  githubUsername: string;
  githubRepo: string;
  githubBranch: string;
  personalAccessToken: string;
}
