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
