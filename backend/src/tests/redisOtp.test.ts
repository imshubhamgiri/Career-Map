import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisOtpService, StoredOtpData } from '../services/otp/redisOtp.service';
import { Redis } from 'ioredis';

describe('RedisOtpService Unit Tests', () => {
  let mockRedis: any;
  let otpService: RedisOtpService;

  beforeEach(() => {
    mockRedis = {
      set: vi.fn().mockResolvedValue('OK'),
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(1),
      ttl: vi.fn().mockResolvedValue(-2),
    };
    otpService = new RedisOtpService(mockRedis as unknown as Redis);
  });

  describe('storeOtp()', () => {
    it('normalizes email to lowercase and trims whitespace', async () => {
      const email = '  TestUser@Career-OS.Dev  ';
      await otpService.storeOtp(email, {
        userId: 'u-123',
        codeHash: 'hashed_otp_code',
      });

      const expectedKey = 'otp:email_verify:testuser@career-os.dev';
      expect(mockRedis.set).toHaveBeenCalledTimes(1);
      const [key, payloadStr, mode, ttl] = mockRedis.set.mock.calls[0];

      expect(key).toBe(expectedKey);
      expect(mode).toBe('EX');
      expect(ttl).toBe(900); // Default 15 minutes

      const parsed: StoredOtpData = JSON.parse(payloadStr);
      expect(parsed.userId).toBe('u-123');
      expect(parsed.codeHash).toBe('hashed_otp_code');
      expect(parsed.attempts).toBe(0);
      expect(typeof parsed.createdAt).toBe('number');
    });

    it('respects custom TTL parameter', async () => {
      await otpService.storeOtp('user@test.dev', { userId: '1', codeHash: 'hash' }, 300);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'otp:email_verify:user@test.dev',
        expect.any(String),
        'EX',
        300
      );
    });
  });

  describe('getOtp()', () => {
    it('returns parsed StoredOtpData when key exists and JSON is valid', async () => {
      const payload: StoredOtpData = {
        userId: 'u-456',
        codeHash: 'hash-xyz',
        attempts: 2,
        createdAt: 1700000000000,
      };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(payload));

      const result = await otpService.getOtp('user@test.dev');

      expect(mockRedis.get).toHaveBeenCalledWith('otp:email_verify:user@test.dev');
      expect(result).toEqual(payload);
    });

    it('returns null when key does not exist in Redis', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await otpService.getOtp('missing@test.dev');

      expect(result).toBeNull();
    });

    it('returns null gracefully when payload contains corrupt/malformed JSON', async () => {
      mockRedis.get.mockResolvedValueOnce('{corrupt-json-structure');

      const result = await otpService.getOtp('corrupt@test.dev');

      expect(result).toBeNull();
    });
  });

  describe('incrementAttempts()', () => {
    it('increments attempts counter and preserves remaining TTL', async () => {
      const initialData: StoredOtpData = {
        userId: 'u-123',
        codeHash: 'hash',
        attempts: 1,
        createdAt: Date.now(),
      };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(initialData));
      mockRedis.ttl.mockResolvedValueOnce(750); // 750 seconds left

      const attempts = await otpService.incrementAttempts('user@test.dev');

      expect(attempts).toBe(2);
      expect(mockRedis.set).toHaveBeenCalledTimes(1);

      const [key, payloadStr, mode, ttl] = mockRedis.set.mock.calls[0];
      expect(key).toBe('otp:email_verify:user@test.dev');
      expect(mode).toBe('EX');
      expect(ttl).toBe(750);

      const updatedPayload: StoredOtpData = JSON.parse(payloadStr);
      expect(updatedPayload.attempts).toBe(2);
    });

    it('returns 0 if key does not exist when incrementing', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const attempts = await otpService.incrementAttempts('expired@test.dev');

      expect(attempts).toBe(0);
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('returns 0 if remaining TTL <= 0 (expired key)', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({ attempts: 1 }));
      mockRedis.ttl.mockResolvedValueOnce(-1);

      const attempts = await otpService.incrementAttempts('expired@test.dev');

      expect(attempts).toBe(0);
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('deleteOtp()', () => {
    it('deletes the normalized key in Redis', async () => {
      await otpService.deleteOtp('  DeleteMe@Career-OS.Dev ');

      expect(mockRedis.del).toHaveBeenCalledWith('otp:email_verify:deleteme@career-os.dev');
    });
  });

  describe('checkAndSetCooldown()', () => {
    it('disallows request when cooldown is active with remaining TTL', async () => {
      mockRedis.ttl.mockResolvedValueOnce(42);

      const result = await otpService.checkAndSetCooldown('cooldown@test.dev');

      expect(result).toEqual({ allowed: false, remainingSeconds: 42 });
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('allows request and sets cooldown lock with NX when key does not exist', async () => {
      mockRedis.ttl.mockResolvedValueOnce(-2); // Key does not exist

      const result = await otpService.checkAndSetCooldown('cooldown@test.dev', 60);

      expect(result).toEqual({ allowed: true, remainingSeconds: 0 });
      expect(mockRedis.set).toHaveBeenCalledWith(
        'otp:cooldown:cooldown@test.dev',
        '1',
        'EX',
        60
      );
    });
  });

  describe('clearCooldown()', () => {
    it('deletes the cooldown key in Redis', async () => {
      await otpService.clearCooldown('ClearMe@Career-OS.Dev');

      expect(mockRedis.del).toHaveBeenCalledWith('otp:cooldown:clearme@career-os.dev');
    });
  });
});
