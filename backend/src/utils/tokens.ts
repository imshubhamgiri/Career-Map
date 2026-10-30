import ms from 'ms';
import jwt from 'jsonwebtoken';
import { CookieOptions, Response } from 'express';
import { env } from '../config/env';

export const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
export const COOKIE_SECRET = env.COOKIE_SECRET;

const isProduction = env.NODE_ENV === 'production';

export interface AccessTokenPayload {
    userId: string;
    email: string;
}

export function generateAccessToken(user: { id: string; email: string }): string {
    const payload: AccessTokenPayload = { userId: user.id, email: user.email };
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

export function getBaseAccessTokenOptions(): CookieOptions {
    return{
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',  
    }
}

export function getBaseRefreshTokenOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        signed: true,
        path: '/',
    }
}


export function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      ...getBaseAccessTokenOptions(),
      maxAge: ms('15m'),
    });
  
    res.cookie('refresh_token', refreshToken, {
      ...getBaseRefreshTokenOptions(),
      maxAge: ms('7d'),
    });
}

export function clearTokenCookies(res: Response) {
    res.clearCookie('access_token', getBaseAccessTokenOptions());
    res.clearCookie('refresh_token', getBaseRefreshTokenOptions());
}