import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

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
