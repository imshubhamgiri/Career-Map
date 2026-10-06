export type RoadmapStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "UNKNOWN";

export type ProgressStatus = "NOT_STARTED" | "ATTEMPTED" | "SOLVED" | "REVISE";

export type GithubSyncStatus = "PENDING" | "PROCESSING" | "SYNCED" | "FAILED" | "SKIPPED";

export interface CanonicalProblem {
  id: string;
  canonicalSlug: string;
  title: string;
  difficulty: Difficulty;
  platform?: string | null;
  externalUrl?: string | null;
  platformProblemId?: string | null;
}

export interface RoadmapProblemItem {
  id: string;
  roadmapId: string;
  problemId: string;
  topic: string;
  originalTitle: string;
  originalUrl?: string | null;
  originalCategory?: string | null;
  originalDifficulty: Difficulty;
  orderIndex: number;
  createdAt?: string;
  problem?: CanonicalProblem;
  status: ProgressStatus;
  solvedAt?: string | null;
  githubSyncStatus?: GithubSyncStatus | null;
  githubRepo?: string | null;
  githubCommitSha?: string | null;
  githubFilePath?: string | null;
  timeComplexity?: string | null;
  spaceComplexity?: string | null;
  aiNotes?: string | null;
  userNotes?: string | null;
  code?: string | null;
  language?: string | null;
}

export interface TopicGroup {
  topic: string;
  total: number;
  solved: number;
  progressPercentage: number;
  problems: RoadmapProblemItem[];
}

export interface Roadmap {
  id: string;
  userId: string;
  title: string;
  sourceType: "pdf" | "drive_url" | "manual" | string;
  sourceUrl?: string | null;
  status: RoadmapStatus;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  totalProblems?: number;
  solvedProblems?: number;
  progressPercentage?: number;
}

export interface RoadmapDetail extends Roadmap {
  roadmapProblems: RoadmapProblemItem[];
  topics: TopicGroup[];
  totalProblems: number;
  solvedProblems: number;
  progressPercentage: number;
}
