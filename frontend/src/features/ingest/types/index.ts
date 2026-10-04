export interface IngestJobRequest {
  sourceType: "pdf" | "drive_url" | "manual";
  sourceUrl?: string;
  title: string;
}

export interface IngestJobResponse {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
}
