import { STOPWORDS } from './stopwords';

/**
 * Result of sanitizing a user-provided query for NATURAL LANGUAGE MODE FTS.
 */
export interface SanitizedFtsQuery {
  /** Sanitized query string (lowercased, whitespace-normalized, stopwords removed). */
  query: string;
  /** True when the query contains no meaningful terms after stopword removal. */
  isEmpty: boolean;
}

/**
 * Sanitizes a user-provided query string before passing it to MySQL
 * MATCH ... AGAINST() in NATURAL LANGUAGE MODE.
 *
 * Processing:
 * 1. Trim and collapse whitespace to single spaces
 * 2. Lowercase (most stopwords are lowercase forms)
 * 3. Split into tokens
 * 4. Remove stopwords (Spanish and English prepositions/articles)
 * 5. Rejoin remaining tokens
 *
 * NATURAL LANGUAGE MODE does not use FTS operators, so no operator stripping
 * is needed. The ngram parser handles substring matching naturally.
 *
 * @param query - Raw user input
 * @returns Sanitized query with a flag indicating whether the result is empty
 */
export function sanitizeFtsQuery(query: string): SanitizedFtsQuery {
  const tokens = query
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));

  const sanitized = tokens.join(' ');

  return {
    query: sanitized,
    isEmpty: sanitized.length === 0,
  };
}
