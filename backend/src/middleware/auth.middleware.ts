import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AccessTokenPayload, ACCESS_TOKEN_SECRET } from '../utils/tokens';
import { hashApiKey } from '../utils/crypto';
import { ApiKeyRepository } from '../repositories/apiKey.repository';
import { ErrorResponse } from '../types';

const apiKeyRepo = new ApiKeyRepository();

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

export const verifyApiKey = async (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const headerKey = req.headers['x-api-key'];
    const rawKey =
      (typeof headerKey === 'string' ? headerKey : undefined) || extractToken(req);

    if (!rawKey) {
      res.status(401).json({
        success: false,
        message: 'Invalid or missing API key',
        error: 'Invalid or missing API key',
      });
      return;
    }

    const keyHash = hashApiKey(rawKey);
    const apiKeyRecord = await apiKeyRepo.findActiveByHash(keyHash);

    if (!apiKeyRecord) {
      res.status(401).json({
        success: false,
        message: 'Invalid, expired, or revoked API key',
        error: 'Invalid, expired, or revoked API key',
      });
      return;
    }

    req.user = { userId: apiKeyRecord.userId } as AccessTokenPayload;

    // Fire-and-forget last_used_at update
    apiKeyRepo.updateLastUsed(apiKeyRecord.id).catch(() => {});

    next();
  } catch (err) {
    next(err);
  }
};

