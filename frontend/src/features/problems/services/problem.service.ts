import { apiClient } from "@/lib/api-client";
import type { ProgressStatus } from "@/features/roadmaps/types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ProgressEventResponse {
  id: string;
  userId: string;
  problemId: string;
  status: ProgressStatus;
  aiNotes?: string | null;
  solvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function updateProblemProgress(
  problemId: string,
  status: ProgressStatus,
  aiNotes?: string
): Promise<ProgressEventResponse> {
  const response = await apiClient.post<ApiResponse<ProgressEventResponse>>(
    `/progress/${problemId}`,
    { status, aiNotes }
  );

  return response.data;
}

export interface RetrySyncResponse {
  status: 'queued';
  submissionId: string;
  problemId: string;
  mode: 'FULL_PIPELINE' | 'GITHUB_PUSH_ONLY';
}

export interface ProblemSubmissionResponse {
  id: string;
  userId: string;
  problemId: string;
  githubSyncStatus: 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED' | 'SKIPPED';
  githubRepo?: string | null;
  githubCommitSha?: string | null;
  githubFilePath?: string | null;
  syncError?: string | null;
  llmStatus?: string | null;
  annotatedCode?: string | null;
}

export async function retryProblemGithubSync(
  problemId: string
): Promise<RetrySyncResponse> {
  const response = await apiClient.post<ApiResponse<RetrySyncResponse>>(
    `/submissions/${problemId}/retry-sync`
  );
  return response.data;
}

export async function fetchProblemSubmission(
  problemId: string
): Promise<ProblemSubmissionResponse | null> {
  try {
    const response = await apiClient.get<ApiResponse<ProblemSubmissionResponse>>(
      `/submissions/${problemId}`
    );
    return response.data;
  } catch {
    return null;
  }
}
