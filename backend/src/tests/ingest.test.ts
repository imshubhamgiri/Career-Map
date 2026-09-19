import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/tokens';
import { slugifyTitle, resolveCanonicalSlug, extractSlugFromUrl } from '../utils/canonicalSlug';
import { IngestUrlSchema } from '../schemas/api.schema';

describe('Unit Tests: Canonical Slug & Identity Resolution', () => {
  it('should extract canonical slugs from LeetCode URLs with or without /description', () => {
    expect(extractSlugFromUrl('https://leetcode.com/problems/two-sum')).toBe('two-sum');
    expect(extractSlugFromUrl('https://leetcode.com/problems/two-sum/description')).toBe('two-sum');
    expect(extractSlugFromUrl('https://leetcode.com/problems/two-sum/')).toBe('two-sum');
  });

  it('should extract canonical slugs from GeeksforGeeks and CodeStudio', () => {
    expect(extractSlugFromUrl('https://www.geeksforgeeks.org/problems/key-pair5556/1')).toBe('key-pair');
    expect(extractSlugFromUrl('https://www.naukri.com/code360/problems/two-sum_839653')).toBe('two-sum');
  });

  it('should generate deterministic fallback hash for symbol-only titles', () => {
    const slug1 = slugifyTitle('???');
    const slug2 = slugifyTitle('???');
    const numberOnly = slugifyTitle('1.');

    expect(slug1).toMatch(/^problem-[a-f0-9]{8}$/);
    expect(slug1).toBe(slug2); // Must be deterministic / idempotent
    expect(numberOnly).toMatch(/^problem-[a-f0-9]{8}$/);
  });

  it('should resolve standard problem titles cleanly', () => {
    expect(slugifyTitle('3Sum')).toBe('3sum');
    expect(slugifyTitle('Reverse Linked List')).toBe('reverse-linked-list');
  });
});

describe('Unit Tests: Ingest URL Validation Schema', () => {
  it('should validate valid URLs with title', () => {
    const parsed = IngestUrlSchema.safeParse({
      url: 'https://leetcode.com/problem-list/top-interview-questions/',
      title: 'Top Interview Questions',
    });
    expect(parsed.success).toBe(true);
  });

  it('should allow optional title', () => {
    const parsed = IngestUrlSchema.safeParse({
      url: 'https://docs.google.com/spreadsheets/d/12345/edit',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBeUndefined();
    }
  });

  it('should reject invalid URLs', () => {
    const parsed = IngestUrlSchema.safeParse({
      url: 'not-a-valid-url',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('Integration Tests: Ingest Endpoints via Supertest', () => {
  const testUser = { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', email: 'tester@career-os.dev' };
  let authToken: string;

  beforeEach(() => {
    authToken = generateAccessToken(testUser);
  });

  it('POST /api/ingest/url - rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/ingest/url')
      .send({ url: 'https://docs.google.com/spreadsheets/d/test/edit' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token/i);
  });

  it('POST /api/ingest/url - rejects invalid URL with 400 Validation failed', async () => {
    const res = await request(app)
      .post('/api/ingest/url')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ url: 'invalid-url' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
  });
});

