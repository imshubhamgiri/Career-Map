import { z } from 'zod';

const DifficultyEnumSchema = z
  .enum(['Easy', 'Medium', 'Hard', 'EASY', 'MEDIUM', 'HARD', 'Unknown', 'UNKNOWN'])
  .optional()
  .default('UNKNOWN');

/**
 * Validates incoming submission payloads from `cos-leet` Chrome Extension (`POST /api/v1/submissions`).
 * Supports both canonical field names (`slug`, `title`, `questionId`) and legacy extension aliases
 * (`titleSlug`, `questionTitle`, `problemId`).
 */
export const CreateSubmissionSchema = z
  .object({
    slug: z.string().min(1).max(255).optional(),
    titleSlug: z.string().min(1).max(255).optional(),
    title: z.string().min(1).max(255).optional(),
    questionTitle: z.string().min(1).max(255).optional(),
    difficulty: DifficultyEnumSchema,
    questionId: z.union([z.string(), z.number()]).transform(String).optional(),
    problemId: z.union([z.string(), z.number()]).transform(String).optional(),
    submissionId: z.union([z.string(), z.number()]).transform(String).optional(),
    code: z.string().min(1, 'Solution code is required').max(100_000),
    language: z.string().min(1, 'Programming language is required').max(50),
    status: z.string().max(50).optional().default('Accepted'),
    runtime: z.union([z.string(), z.number()]).transform(String).optional(),
    memory: z.union([z.string(), z.number()]).transform(String).optional(),
    timestamp: z.number().int().optional(),
  })
  .refine((data) => Boolean(data.slug || data.titleSlug), {
    message: 'Either slug or titleSlug is required',
    path: ['slug'],
  })
  .refine((data) => Boolean(data.title || data.questionTitle), {
    message: 'Either title or questionTitle is required',
    path: ['title'],
  })
  .transform((data) => ({
    slug: (data.slug || data.titleSlug)!.trim().toLowerCase(),
    title: (data.title || data.questionTitle)!.trim(),
    difficulty: data.difficulty,
    questionId: data.questionId || data.problemId,
    submissionId: data.submissionId,
    code: data.code,
    language: data.language.trim(),
    status: data.status,
    runtime: data.runtime,
    memory: data.memory,
    timestamp: data.timestamp ?? Date.now(),
  }));

export type ValidatedSubmissionPayload = z.output<typeof CreateSubmissionSchema>;

/**
 * Structured output schema for Stage 1 Gemini 2.5 Flash evaluation in `githubSyncWorker`.
 */
export const SubmissionAnalysisSchema = z.object({
  annotatedCode: z
    .string()
    .describe(
      "The user's exact working solution code enriched with clear, step-by-step inline comments explaining the logic of each block. Do NOT alter the executable logic."
    ),
  platformNotes: z
    .string()
    .describe(
      'Concise, scannable Markdown revision guide for the Career OS platform containing: ### Intuition, ### Approach, ### Complexity, and ### Key Takeaway.'
    ),
  timeComplexity: z.string().describe('Big-O time complexity, e.g., O(n log n)'),
  spaceComplexity: z.string().describe('Big-O space complexity, e.g., O(n)'),
});

export type SubmissionAnalysisResult = z.infer<typeof SubmissionAnalysisSchema>;
