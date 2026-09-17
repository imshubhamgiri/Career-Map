import { z } from 'zod';

export const IngestUrlSchema = z.object({
  url: z.url('A valid URL is required'),
});

 const BaseUserSchema = z.object({
  name: z.string().min(3, 'Username must be at least 3 characters long'),
  email: z.email('A valid email is required'),
});

export const emailSchema = BaseUserSchema.extend({ 
  password: z.string().min(6, 'Password must be at least 6 characters long')
 });

 export const oauthRegisterSchema = BaseUserSchema.extend({
  oauthProvider: z.enum(['google', 'github', 'facebook']),
  oauthId: z.string().min(1, 'OAuth ID is required'),
});

export const loginSchema = z.object({
  email: z.email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type IngestUrlInput = z.infer<typeof IngestUrlSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

