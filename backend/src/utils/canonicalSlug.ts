import { createHash } from 'crypto';

/**
 * Generates a clean, platform-agnostic canonical slug representing a universal DSA problem.
 * Strips platform prefixes, query parameters, trailing slashes, and problem numbers.
 */
export function slugifyTitle(title: string): string {
  // [PHASE 5 FIX]: Handle empty or symbol-only titles safely.
  // Stripping numbers and non-alphanumeric chars can leave an empty string (""),
  // which causes unique constraint violations in problems.canonical_slug.
  const cleaned = (title || '')
    .trim()
    // Remove leading numbering like "1. ", "Problem 4: ", "[Easy] "
    .replace(/^(\d+[\.\:\-\s]+|problem\s*\d*[\.\:\-\s]+|day\s*\d*[\.\:\-\s]+)/i, '')
    // Lowercase
    .toLowerCase()
    // Replace non-alphanumeric with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Strip leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // [PHASE 5 FIX]: If sanitization leaves an empty string, generate a deterministic hash fallback
  if (!cleaned) {
    const raw = (title || '').trim() || 'problem';
    const hash = createHash('sha256').update(raw).digest('hex').slice(0, 8);
    return `problem-${hash}`;
  }

  return cleaned;
}

/**
 * Extract universal problem slug from well-known practice platforms (LeetCode, GFG, CodeStudio, etc.)
 */
export function extractSlugFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase().replace(/\/$/, '');

    // 1. LeetCode: /problems/two-sum or /problems/two-sum/description
    if (hostname.includes('leetcode')) {
      const leetcodeMatch = pathname.match(/\/problems\/([a-z0-9\-]+)/);
      if (leetcodeMatch && leetcodeMatch[1]) {
        return leetcodeMatch[1];
      }
    }

    // 2. GeeksforGeeks: /problems/key-pair5556/1 -> key-pair
    if (hostname.includes('geeksforgeeks')) {
      const gfgMatch = pathname.match(/\/problems\/([a-z0-9\-]+)/);
      if (gfgMatch && gfgMatch[1]) {
        // Remove GFG numeric hash suffixes like key-pair5556 -> key-pair
        return gfgMatch[1].replace(/\d+$/, '');
      }
    }

    // 3. CodeStudio / Naukri Code360: /problems/two-sum_839653
    if (hostname.includes('naukri') || hostname.includes('codingninjas')) {
      const codeStudioMatch = pathname.match(/\/problems\/([a-z0-9\-]+)/);
      if (codeStudioMatch && codeStudioMatch[1]) {
        return codeStudioMatch[1].split('_')[0];
      }
    }

    // 4. HackerRank: /challenges/simple-array-sum
    if (hostname.includes('hackerrank')) {
      const hackerRankMatch = pathname.match(/\/challenges\/([a-z0-9\-]+)/);
      if (hackerRankMatch && hackerRankMatch[1]) {
        return hackerRankMatch[1];
      }
    }

    // Fallback: any generic /problems/<slug>
    const genericMatch = pathname.match(/\/problems\/([a-z0-9\-]+)/);
    if (genericMatch && genericMatch[1]) {
      return genericMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Master Problem Identity Resolver:
 * Determines the canonical universal slug for a DSA problem.
 */
export function resolveCanonicalSlug(title: string, url?: string): string {
  // [PHASE 5 FIX]: If a recognizable platform URL is provided, prefer its standard problem slug
  if (url && url.trim().length > 0) {
    const slugFromUrl = extractSlugFromUrl(url.trim());
    if (slugFromUrl && slugFromUrl.trim().length > 0) {
      return slugFromUrl.trim();
    }
  }

  // [PHASE 5 FIX]: Fallback to normalized title slug (guaranteed non-empty via hash fallback)
  return slugifyTitle(title);
}

