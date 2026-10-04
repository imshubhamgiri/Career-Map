export type Difficulty = "UNKNOWN" | "EASY" | "MEDIUM" | "HARD";
export type ProgressStatus = "NOT_STARTED" | "ATTEMPTED" | "SOLVED" | "REVISE";

export interface Problem {
  id: string;
  canonicalSlug: string;
  title: string;
  difficulty: Difficulty;
  platform?: string | null;
  externalUrl?: string | null;
}
