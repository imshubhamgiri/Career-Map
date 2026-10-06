import type { ApiKeyResponse, CreateApiKeyResult, GithubConfig, GithubConfigForm } from "../types";
import { apiClient } from "@/lib/api-client"

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface VerifyGithubConfigResult {
    valid: boolean;
    repository: string;
    defaultBranch: string;
    isPrivate: boolean;
    hasPushAccess: boolean;
}

export async function fetchSettings(): Promise<{ apiKeys: ApiKeyResponse[]; githubConfig: GithubConfig | null }> {
  const response = await apiClient.get<ApiResponse<{ apiKeys: ApiKeyResponse[]; githubConfig: GithubConfig | null }>>('/settings');
  if(!response?.data || !response.data.apiKeys || !Array.isArray(response.data.apiKeys)) {
    return { apiKeys: [], githubConfig: null };
  }
  if(!response.data.githubConfig) {
    return { apiKeys: response.data.apiKeys, githubConfig: null };  
  }
  return response.data;
}




export async function generateApiKey({ name }: { name?: string }): Promise<CreateApiKeyResult>{
    const response = await apiClient.post<ApiResponse<CreateApiKeyResult>>('/settings/api-keys', { name });
    return response.data;
}


export async function deleteApiKey(apiKeyId: string): Promise<void> {
    await apiClient.delete(`/settings/api-keys/${apiKeyId}`);
}



export async function updateGithubConfig(
    config: GithubConfigForm
): Promise<ApiResponse<GithubConfig>> {
    const response = await apiClient.put<ApiResponse<GithubConfig>>(`/settings/github`, config);
    return response;
}

export type VerifyGithubConfigPayload = Pick<
  GithubConfigForm,
  "githubUsername" | "githubRepo" | "personalAccessToken"
>;

export async function verifyGithubConfig(
    data: VerifyGithubConfigPayload
): Promise<ApiResponse<VerifyGithubConfigResult>> {
    const response = await apiClient.post<ApiResponse<VerifyGithubConfigResult>>('/settings/github/verify', data);
    return response;
}