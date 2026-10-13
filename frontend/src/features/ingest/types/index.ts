export type IngestStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface IngestJobRequest {
  sourceType?: "pdf" | "drive_url" | "manual" | "URL" | "GOOGLE_SHEETS" | "GOOGLE_DOCS";
  sourceUrl?: string;
  title?: string;
}

export interface IngestUrlResponse {
  id: string;
  userId: string;
  title: string;
  sourceType: string;
  sourceUrl?: string | null;
  status: IngestStatus;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IngestStatusResponse {
  roadmapId: string;
  title: string;
  sourceType?: string;
  sourceUrl?: string | null;
  status: IngestStatus;
  errorMessage?: string | null;
  problemCount: number;
  updatedAt: string;
}
