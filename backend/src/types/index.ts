import { z } from 'zod';
import { ExtractedQuestionSchema, ChunkResultSchema } from '../schemas/problem.schema';
import {
  emailSchema,
  IngestUrlSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  oauthRegisterSchema,
} from '../schemas/api.schema';
import { CreateRoadmapSchema } from '../schemas/roadmap.schema';

export type ExtractedQuestion = z.infer<typeof ExtractedQuestionSchema>;
export type ChunkResult = z.infer<typeof ChunkResultSchema>;
export type RegisterUserInput = z.infer<typeof emailSchema>;
export type IngestUrlInput = z.infer<typeof IngestUrlSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OAuthRegisterInput = z.infer<typeof oauthRegisterSchema>;
export type CreateRoadmapInput = z.infer<typeof CreateRoadmapSchema>;

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

export interface UserResponse {
  id?: string;
  name?: string;
  email: string;
  isEmailVerified?: boolean;
}

export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface IUserInput {
  name: string | null;
  email: string;
  passwordHash?: string | null;
  provider?: 'google' | 'github' | 'facebook';
  providerId?: string;
}

export interface ErrorResponse {
  success: false;
  message?: string;
  error: string | { field: string; message: string }[];
  details?: unknown;
  stack?: string;
}

export interface SuccessResponse<T> {
  success: true;
  message?: string;
  data?: T;
  user?: UserResponse;
  accessToken?: string;
  problems?: ExtractedQuestion[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  user?: UserResponse;
  accessToken?: string;
  problems?: ExtractedQuestion[];
  error?: string | { field: string; message: string }[];
}
