import { Redis } from 'ioredis';
import { redisClient } from '../../config/redis';
import { logger } from '../../utils/logger';

const log = logger.child({ service: 'RedisOtpService' });

export interface StoredOtpData {
  userId: string;
  codeHash: string;
  attempts: number;
  createdAt: number;
}

export class RedisOtpService {
  constructor(private redis: Redis = redisClient) {}

  private getOtpKey(email: string): string {
    return `otp:email_verify:${email.toLowerCase().trim()}`;
  }

  private getCooldownKey(email: string): string {
    return `otp:cooldown:${email.toLowerCase().trim()}`;
  }

  /**
   * Store a hashed OTP in Redis with an automatic TTL (default 15 minutes / 900 seconds).
   */
  async storeOtp(
    email: string,
    data: { userId: string; codeHash: string },
    ttlSeconds = 900
  ): Promise<void> {
    const key = this.getOtpKey(email);
    const payload: StoredOtpData = {
      userId: data.userId,
      codeHash: data.codeHash,
      attempts: 0,
      createdAt: Date.now(),
    };

    await this.redis.set(key, JSON.stringify(payload), 'EX', ttlSeconds);
    log.debug({ email, ttlSeconds }, 'Stored OTP in Redis');
  }

  /**
   * Retrieve active OTP data for an email address.
   */
  async getOtp(email: string): Promise<StoredOtpData | null> {
    const key = this.getOtpKey(email);
    const raw = await this.redis.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as StoredOtpData;
    } catch {
      return null;
    }
  }

  /**
   * Atomically increment the failed attempt count, preserving remaining TTL.
   */
  async incrementAttempts(email: string): Promise<number> {
    const key = this.getOtpKey(email);
    const raw = await this.redis.get(key);
    if (!raw) return 0;

    const ttl = await this.redis.ttl(key);
    if (ttl <= 0) return 0;

    const data: StoredOtpData = JSON.parse(raw);
    data.attempts += 1;

    await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
    return data.attempts;
  }

  /**
   * Invalidate/delete the OTP key upon successful verification or max attempts exceeded.
   */
  async deleteOtp(email: string): Promise<void> {
    const key = this.getOtpKey(email);
    await this.redis.del(key);
  }

  /**
   * Enforce rate-limiting cooldown for OTP generation/resend (default 60 seconds).
   */
  async checkAndSetCooldown(
    email: string,
    cooldownSeconds = 60
  ): Promise<{ allowed: boolean; remainingSeconds: number }> {
    const cooldownKey = this.getCooldownKey(email);
    const remaining = await this.redis.ttl(cooldownKey);

    if (remaining > 0) {
      return { allowed: false, remainingSeconds: remaining };
    }

    // Set cooldown with expiration
    await this.redis.set(cooldownKey, '1', 'EX', cooldownSeconds);
    return { allowed: true, remainingSeconds: 0 };
  }

  /**
   * Clear cooldown key (e.g. after successful verification).
   */
  async clearCooldown(email: string): Promise<void> {
    const cooldownKey = this.getCooldownKey(email);
    await this.redis.del(cooldownKey);
  }
}

export const redisOtpService = new RedisOtpService();

