import { Request, Response, NextFunction } from 'express';
import { emailSchema, oauthRegisterSchema, loginSchema, IngestUrlSchema } from '../schemas/api.schema';
import { ErrorResponse } from '../types/index';
import * as z from 'zod';


// const ErrorResponseSchema = z.object({
//   success: z.literal(false),
//   message: z.string(),
//   error: z.array(
//     z.object({
//       field: z.string(),
//       message: z.string(),
//     })
//   ),
// });

// type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export function validateBody(schema: z.ZodType<any>) {
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
  req:Request<{}, {}, typeof emailSchema>,
   res: Response<ErrorResponse>,
    next: NextFunction
  ):
   void =>
 {
  validateSchema(emailSchema, req, res, next);
}

export const oAuthRegisterBody = (
  req: Request<{}, {}, typeof oauthRegisterSchema>,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  validateSchema(oauthRegisterSchema, req, res, next);
};

export const validateLoginBody = (
  req: Request<{}, {}, typeof loginSchema>,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  validateSchema(loginSchema, req, res, next);
};

export const validateUrl = (
  req: Request<{}, {}, { url: string }>,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {

  validateSchema( IngestUrlSchema, req, res,  next );
};
