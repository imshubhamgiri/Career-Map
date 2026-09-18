/**
 * Generates a clean, platform-agnostic canonical slug representing a universal DSA problem.
 * Strips platform prefixes, query parameters, trailing slashes, and problem numbers.
 */
export function slugifyTitle(title: string): string {
  return title
    .trim()
    // Remove leading numbering like "1. ", "Problem 4: ", "[Easy] "
    .replace(/^(\d+[\.\:\-\s]+|problem\s*\d*[\.\:\-\s]+|day\s*\d*[\.\:\-\s]+)/i, '')
    // Lowercase
    .toLowerCase()
    // Replace non-alphanumeric with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Strip leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract universal problem slug from well-known practice platforms (LeetCode, GFG, CodeStudio, etc.)
 */
export function extractSlugFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase().replace(/\/$/, '');

    // 1. LeetCode: /problems/two-sum or /problems/two-sum/description
    const leetcodeMatch = pathname.match(/\/problems\/([a-z0-9\-]+)/);
    if (leetcodeMatch && leetcodeMatch[1]) {
      return leetcodeMatch[1];
    }

    // 2. GeeksforGeeks: /problems/key-pair5556/1 -> key-pair
    const gfgMatch = pathname.match(/\/problems\/([a-z0-9\-]+)/);
    if (gfgMatch && gfgMatch[1]) {
      // Remove GFG numeric hash suffixes like key-pair5556 -> key-pair
      return gfgMatch[1].replace(/\d+$/, '');
    }

    // 3. CodeStudio / Naukri Code360: /problems/two-sum_839653
    const codeStudioMatch = pathname.match(/\/problems\/([a-z0-9\-]+)/);
    if (codeStudioMatch && codeStudioMatch[1]) {
      return codeStudioMatch[1].split('_')[0];
    }

    // 4. HackerRank: /challenges/simple-array-sum
    const hackerRankMatch = pathname.match(/\/challenges\/([a-z0-9\-]+)/);
    if (hackerRankMatch && hackerRankMatch[1]) {
      return hackerRankMatch[1];
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
  // If a recognizable platform URL is provided, prefer its standard problem slug
  if (url && url.trim().length > 0) {
    const slugFromUrl = extractSlugFromUrl(url.trim());
    if (slugFromUrl) {
      return slugFromUrl;
    }
  }

  // Fallback to normalized title slug
  return slugifyTitle(title);
}

