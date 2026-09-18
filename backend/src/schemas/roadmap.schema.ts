import { z } from 'zod';

export const CreateRoadmapSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  sourceType: z.enum(['URL', 'PDF', 'GOOGLE_DOCS', 'GOOGLE_SHEETS', 'MANUAL'], {
    error: 'sourceType must be URL, PDF, GOOGLE_DOCS, GOOGLE_SHEETS, or MANUAL',
  }),
  sourceUrl: z.url('A valid source URL is required').optional(),
});

export type CreateRoadmapInput = z.infer<typeof CreateRoadmapSchema>;

