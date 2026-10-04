export type RoadmapStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Roadmap {
  id: string;
  userId: string;
  title: string;
  sourceType: "pdf" | "drive_url" | "manual";
  sourceUrl?: string | null;
  status: RoadmapStatus;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}
