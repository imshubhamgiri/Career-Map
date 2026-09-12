import { z } from 'zod';

export const ExtractedQuestionSchema = z.object({
  title: z.string().describe('Exact clean title of the problem, without leading numbers'),
  url: z.string().describe('Practice link (LeetCode, GFG, CodeStudio). Empty string if none'),
  category: z.string().describe('DSA Topic e.g., Arrays, Binary Trees, DP. Infer if omitted'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Unknown']).describe('Infer based on LeetCode/GFG data if missing'),
  platform: z.enum(['LeetCode', 'GeeksforGeeks', 'CodeStudio', 'HackerRank', 'Other']),
});

export const ChunkResultSchema = z.object({
  containsProblems: z.boolean().describe('Set false if chunk only contains instructions, author notes, or non-DSA text'),
  problems: z.array(ExtractedQuestionSchema),
});
