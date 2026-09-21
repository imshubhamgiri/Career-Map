import { Request, Response, NextFunction } from 'express';
import {
  emailSchema,
  oauthRegisterSchema,
  loginSchema,
  IngestUrlSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../schemas/api.schema';
import {
  ErrorResponse,
  RegisterUserInput,
  OAuthRegisterInput,
  LoginInput,
  IngestUrlInput,
  VerifyEmailInput,
  ResendVerificationInput,
} from '../types/index';
import * as z from 'zod';

export function validateBody<T>(schema: z.ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(result.error);
    }
    req.body = result.data;
    next();
  };
}

const validateSchema = <T>(
  schema: z.ZodType<T>,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((err) => ({
      field: String(err.path[0]),
      message: err.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: errors,
    });
    return;
  }

  req.body = result.data as Record<string, unknown>;
  next();
};

export const validateRegisterBody = (
  req: Request<{}, {}, RegisterUserInput>,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  validateSchema(emailSchema, req, res, next);
};

export const oAuthRegisterBody = (
  req: Request<{}, {}, OAuthRegisterInput>,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  validateSchema(oauthRegisterSchema, req, res, next);
};

export const validateLoginBody = (
  req: Request<{}, {}, LoginInput>,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  validateSchema(loginSchema, req, res, next);
};

export const validateUrl = (
  req: Request<{}, {}, IngestUrlInput>,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  validateSchema(IngestUrlSchema, req, res, next);
};

export const validateVerifyEmailBody = (
  req: Request<{}, {}, VerifyEmailInput>,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  validateSchema(verifyEmailSchema, req, res, next);
};

export const validateResendVerificationBody = (
  req: Request<{}, {}, ResendVerificationInput>,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  validateSchema(resendVerificationSchema, req, res, next);
};
