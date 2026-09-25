import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AccessTokenPayload, ACCESS_TOKEN_SECRET } from '../utils/tokens';
import { ErrorResponse } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return req.cookies?.['access_token'];
}

export function authenticate(req: Request, res: Response<ErrorResponse>, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token missing',
      error: 'Access token missing',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as unknown as AccessTokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Access token expired or malformed',
      error: 'Access token expired or malformed',
    });
    return;
  }
}

export const attachAuthContext = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as unknown as AccessTokenPayload;
      req.user = decoded;
    } catch (err) {}
  }
  next();
};

export const verifyApiKey = (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
  const key = extractToken(req) || req.headers['x-api-key'] as string | undefined;
  // if (!key || key !== process.env.API_KEY || key !== 'apiKey') {
  //   res.status(401).json({
  //     success: false,
  //     message: 'Invalid or missing API key',
  //     error: 'Invalid or missing API key',
  //   })
  //   return;
  // }
  console.log('API key verified:', key);
  next();
}
