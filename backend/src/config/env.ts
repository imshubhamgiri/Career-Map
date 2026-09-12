import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from cwd or backend project root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('3000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  GOOGLE_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
