import { z } from 'zod';
import { ProgressStatus } from '@prisma/client';

export const UpdateProgressSchema = z.object({
  status: z.nativeEnum(ProgressStatus),
  aiNotes: z.string().optional(),
});

export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;
