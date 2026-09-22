export interface SubmissionPayload {
  titleSlug: string;
  questionTitle: string;
  code: string;
  language: string;
  status: string;
  runtime: string | number;
  memory: string | number;
  timestamp: number;
}

export interface LeetCodeSubmissionItem {
  id: string;
  statusDisplay: string;
  lang: string;
  runtime: string;
  timestamp: string | number;
  url?: string;
  isPending?: string;
  title?: string;
  memory: string;
}

export interface LeetCodeSubmissionListResponse {
  data?: {
    submissionList?: {
      submissions: LeetCodeSubmissionItem[];
      hasNext: boolean;
      totalNum?: number;
    };
  };
  errors?: Array<{ message: string }>;
}

export interface LeetCodeSubmissionDetailsRaw {
  runtime?: number | null;
  runtimeDisplay?: string | null;
  runtimePercentile?: number | null;
  memory?: number | null;
  memoryDisplay?: string | null;
  memoryPercentile?: number | null;
  code?: string;
  timestamp?: number;
  statusCode?: number;
  statusDisplay?: string;
  lang?: {
    name: string;
    verboseName: string;
  };
  question?: {
    questionId: string;
    title: string;
    titleSlug: string;
    difficulty?: string;
  };
  notes?: string;
}

export interface LeetCodeSubmissionDetailsResponse {
  data?: {
    submissionDetails?: LeetCodeSubmissionDetailsRaw;
  };
  errors?: Array<{ message: string }>;
}
