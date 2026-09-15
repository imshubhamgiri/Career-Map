import { z } from 'zod';
import { ExtractedQuestionSchema, ChunkResultSchema } from '../schemas/problem.schema';
import { emailSchema } from '../schemas/api.schema';
export type ExtractedQuestion = z.infer<typeof ExtractedQuestionSchema>;
export type ChunkResult = z.infer<typeof ChunkResultSchema>;
export type RegisterUserInput = z.infer<typeof emailSchema>;

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


export interface ErrorResponse {
success: false;
message: string;
error: string | { field: string; message: string }[];
}

export interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export type PipelineResult = PipelineSuccessResult | PipelineFailureResult;
