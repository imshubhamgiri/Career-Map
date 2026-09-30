import crypto from 'crypto';

/**
 * Strips single-line (//, #, --) and multi-line (/* ... *\/) comments while preserving
 * string literals, then collapses all whitespace so formatting-only changes produce
 * the exact same normalized representation.
 */
export function stripCommentsAndNormalizeWhitespace(code: string): string {
  if (!code) return '';

  const normalizedNewlines = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Regex matches string literals (double, single, backtick) OR comments (/*...*/, //..., #..., --...)
  // Note: For '#' we avoid stripping C/C++ preprocessor directives like #include or #define
  const tokenRegex =
    /("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`)|(\/\*[\s\S]*?\*\/|\/\/[^\n]*|--[^\n]*|#(?!\s*(?:include|define|ifdef|ifndef|endif|pragma)\b)[^\n]*)/gm;

  const withoutComments = normalizedNewlines.replace(
    tokenRegex,
    (match, stringLiteral: string | undefined) => {
      // Keep string literals intact, replace matched comments with a single space
      if (stringLiteral !== undefined) {
        return stringLiteral;
      }
      return ' ';
    }
  );

  return withoutComments.replace(/\s+/g, ' ').trim();
}

/**
 * Computes a deterministic 64-character SHA-256 hex digest for a (language, code) pair.
 */
export function computeCodeHash(language: string, code: string): string {
  const normalizedLang = (language || 'unknown').toLowerCase().trim();
  const normalizedCode = stripCommentsAndNormalizeWhitespace(code);
  const payload = `${normalizedLang}:${normalizedCode}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

 