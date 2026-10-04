export type GithubSyncStatus = "PENDING" | "PROCESSING" | "SYNCED" | "FAILED" | "SKIPPED";
export type LlmStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: string;
  runtime?: string | null;
  memory?: string | null;
  llmStatus: LlmStatus;
  timeComplexity?: string | null;
  spaceComplexity?: string | null;
  githubSyncStatus: GithubSyncStatus;
  githubRepo?: string | null;
  createdAt: string;
}
