import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AccessTokenPayload, ACCESS_TOKEN_SECRET } from '../utils/tokens';

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

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
       success: false,
       error: 'Access token missing'
       });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as unknown as AccessTokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Access token expired or malformed' });
  }
}

export const attachAuthContext = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as unknown as AccessTokenPayload;
      req.user = decoded;
    } catch (err) {}
  }
  next();
};

