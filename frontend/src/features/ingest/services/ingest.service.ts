import { apiClient } from "@/lib/api-client";
import type { IngestUrlResponse, IngestStatusResponse } from "../types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Initiates roadmap ingestion from a Google Sheet, Doc, or public URL.
 * Offloads parsing to the background BullMQ worker and returns the initial processing record.
 */
export async function startUrlIngestion(
  url: string,
  title?: string
): Promise<IngestUrlResponse> {
  const response = await apiClient.post<ApiResponse<IngestUrlResponse>>("/ingest/url", {
    url: url.trim(),
    title: title?.trim() || undefined,
  });

  if (!response?.data) {
    throw new Error(response?.message || "Failed to initiate URL ingestion");
  }

  return response.data;
}

/**
 * Lightweight status check for background roadmap ingestion.
 * Queries GET /api/v1/ingest/status/:roadmapId to avoid heavy joins while polling.
 */
export async function fetchIngestStatus(
  roadmapId: string
): Promise<IngestStatusResponse> {
  const response = await apiClient.get<ApiResponse<IngestStatusResponse>>(
    `/ingest/status/${roadmapId}`
  );

  if (!response?.data) {
    throw new Error(response?.message || "Failed to fetch ingestion status");
  }

  return response.data;
}

/**
 * Uploads a PDF or document file for DSA extraction.
 */
export async function startFileIngestion(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<ApiResponse<any>>("/ingest/file", formData);
  return response.data;
}
