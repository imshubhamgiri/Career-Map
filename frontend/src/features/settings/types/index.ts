export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface GithubConfig {
  id: string;
  githubUsername: string;
  githubRepo: string;
  githubBranch: string;
  isConfigured: boolean;
  lastSyncedAt?: string | null;
}
