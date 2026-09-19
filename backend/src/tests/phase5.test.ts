import { describe, it, expect } from 'vitest';
import { slugifyTitle, resolveCanonicalSlug } from '../utils/canonicalSlug';
import { ExtractedQuestionInput } from '../services/problems.service';

describe('Phase 5 Batch Deduplication & Slug Fallbacks', () => {
  it('slugifyTitle handles empty or symbol-only titles without producing empty string', () => {
    const symbolSlug = slugifyTitle('???');
    expect(symbolSlug).toMatch(/^problem-[a-f0-9]{8}$/);

    const numberOnlySlug = slugifyTitle('1.');
    expect(numberOnlySlug).toMatch(/^problem-[a-f0-9]{8}$/);

    const emptySlug = slugifyTitle('');
    expect(emptySlug).toMatch(/^problem-[a-f0-9]{8}$/);

    const normalSlug = slugifyTitle('Two Sum');
    expect(normalSlug).toBe('two-sum');
  });

  it('resolveCanonicalSlug normalizes URL variations to identical canonical slug', () => {
    const url1 = 'https://leetcode.com/problems/two-sum';
    const url2 = 'https://leetcode.com/problems/two-sum/description';
    const url3 = 'https://leetcode.com/problems/two-sum/';

    expect(resolveCanonicalSlug('Two Sum', url1)).toBe('two-sum');
    expect(resolveCanonicalSlug('Two Sum', url2)).toBe('two-sum');
    expect(resolveCanonicalSlug('Two Sum', url3)).toBe('two-sum');
  });

  it('Batch deduplication logic collapses duplicate canonical slugs in the same roadmap', () => {
    const duplicateBatch: ExtractedQuestionInput[] = [
      {
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum',
        category: 'Arrays',
        difficulty: 'Easy',
        platform: 'LeetCode',
      },
      {
        title: 'Two Sum (Revise)',
        url: 'https://leetcode.com/problems/two-sum/description',
        category: 'HashMaps',
        difficulty: 'Easy',
        platform: 'LeetCode',
      },
      {
        title: 'Valid Anagram',
        url: 'https://leetcode.com/problems/valid-anagram',
        category: 'Strings',
        difficulty: 'Easy',
        platform: 'LeetCode',
      },
    ];

    const itemsWithSlugs = duplicateBatch.map((item, idx) => ({
      ...item,
      canonicalSlug: resolveCanonicalSlug(item.title, item.url),
      orderIndex: idx,
    }));

    const seenSlugs = new Set<string>();
    const uniqueItems: typeof itemsWithSlugs = [];
    for (const item of itemsWithSlugs) {
      if (!seenSlugs.has(item.canonicalSlug)) {
        seenSlugs.add(item.canonicalSlug);
        uniqueItems.push(item);
      }
    }

    expect(uniqueItems.length).toBe(2);
    expect(uniqueItems[0].canonicalSlug).toBe('two-sum');
    expect(uniqueItems[1].canonicalSlug).toBe('valid-anagram');
  });
});
