import { z } from 'zod';
import { ExtractedQuestionSchema, ChunkResultSchema } from '../schemas/problem.schema';
import { emailSchema, IngestUrlSchema, verifyEmailSchema, resendVerificationSchema } from '../schemas/api.schema';
export type ExtractedQuestion = z.infer<typeof ExtractedQuestionSchema>;
export type ChunkResult = z.infer<typeof ChunkResultSchema>;
export type RegisterUserInput = z.infer<typeof emailSchema>;
export type IngestUrlInput = z.infer<typeof IngestUrlSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export interface PipelineSuccessResult {
  success: true;
  totalExtracted: number;
  data: ExtractedQuestion[];
}

export interface UserResponse {
  id?: string;
  name?: string;
  email: string;
  isEmailVerified?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  user?: T;
  data?: T;
  problems?: ExtractedQuestion[];
  error?: string | { field: string; message: string }[];
}

export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface IUserInput{
name: string | null;
email: string;
passwordHash?: string | null;
provider?: 'google' | 'github' | 'facebook';
providerId?: string;
}
export interface PipelineFailureResult {
  success: false;
  message: string;
  data: never[];
}


export interface ErrorResponse extends ApiResponse<never> {
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
