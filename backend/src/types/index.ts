import { z } from 'zod';
import { ExtractedQuestionSchema, ChunkResultSchema } from '../schemas/problem.schema';

export type ExtractedQuestion = z.infer<typeof ExtractedQuestionSchema>;
export type ChunkResult = z.infer<typeof ChunkResultSchema>;

export interface PipelineSuccessResult {
  success: true;
  totalExtracted: number;
  data: ExtractedQuestion[];
}

export interface PipelineFailureResult {
  success: false;
  message: string;
  data: never[];
}

export type PipelineResult = PipelineSuccessResult | PipelineFailureResult;
