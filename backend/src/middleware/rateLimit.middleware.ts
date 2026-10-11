import { Request, Response } from 'express';
import { rateLimit , ipKeyGenerator} from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../config/redis';

const getRedis = (prefix = 'rl:global:'): RedisStore =>
  new RedisStore({
    prefix,
    sendCommand: async (...args: string[]) => {
      const [command, ...commandArgs] = args as [string, ...string[]];
      const response = await redisClient.call(command, ...commandArgs);
      return response as any;
    },
  });

type RateLimiterOptions = {
  prefix: string;
  windowMs: number;
  limit: number;
  message: Record<string, string>;
  keyGenerator?: (req: Request) => string;
};

const createRateLimiter = ({
  prefix,
  windowMs,
  limit,
  message,
  keyGenerator,
}: RateLimiterOptions) =>
  rateLimit({
    windowMs,
    limit,
    store: getRedis(prefix),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message,
    keyGenerator: (req: Request, _res: Response) => {
      if (keyGenerator) return keyGenerator(req);

      if (req.user?.userId) return `user:${req.user.userId}`;
      console.log("Request IP:", req.ip);
      const ip = req.ip ? ipKeyGenerator(req.ip) : 'unknown';
      return `ip:${ip}`;
    },
  });

export const globalRateLimitMiddleware = createRateLimiter({
  prefix: 'rl:global:',
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { error: 'Too many requests. Please try again later.' },
});

export const loginRateLimit = createRateLimiter({
  prefix: 'rl:login:',
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'Too many login attempts. Please try again later.' },
});

export const registerRateLimit = createRateLimiter({
  prefix: 'rl:register:',
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many registration attempts. Please try again later.' },
});

export const verifyEmailRateLimit = createRateLimiter({
  prefix: 'rl:verify-email:',
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'Too many verification attempts. Please try again later.' },
});

export const resendVerificationRateLimit = createRateLimiter({
  prefix: 'rl:resend-verification:',
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many resend requests. Please try again later.' },
});

export const refreshTokenRateLimit = createRateLimiter({
  prefix: 'rl:refresh:',
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { error: 'Too many refresh attempts. Please try again later.' },
});

export const submissionRateLimit = createRateLimiter({
  prefix: 'rl:submission:',
  windowMs: 60 * 1000,
  limit: 20,
  message: { error: 'Too many submissions. Please slow down.' },
});

export const ingestRateLimit = createRateLimiter({
  prefix: 'rl:ingest:',
  windowMs: 60 * 1000,
  limit: 10,
  message: { error: 'Too many ingestion requests. Please try again later.' },
});

export const roadmapRateLimit = createRateLimiter({
  prefix: 'rl:roadmap:',
  windowMs: 60 * 1000,
  limit: 40,
  message: { error: 'Too many roadmap requests. Please slow down.' },
});

export const settingsRateLimit = createRateLimiter({
  prefix: 'rl:settings:',
  windowMs: 60 * 1000,
  limit: 30,
  message: { error: 'Too many settings requests. Please try again later.' },
});

export const deleteAccountRateLimit = createRateLimiter({
  prefix: 'rl:delete-account:',
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many account-deletion attempts. Please try again later.' },
});