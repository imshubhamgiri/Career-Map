export type ShowcaseStageId =
  | "ingest"
  | "config"
  | "github"
  | "submission"
  | "notes"
  | "git-push"
  | "multi-roadmap";

export interface ShowcaseStep {
  id: ShowcaseStageId;
  stepNumber: string;
  badge: string;
  title: string;
  shortTitle: string;
  description: string;
  durationMs: number;
  highlightTag?: string;
  takeaways?: string[];
}
