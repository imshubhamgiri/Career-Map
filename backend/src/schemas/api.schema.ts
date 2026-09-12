import { z } from 'zod';

export const IngestUrlSchema = z.object({
  url: z.url('A valid URL is required'),
});

export type IngestUrlInput = z.infer<typeof IngestUrlSchema>;
