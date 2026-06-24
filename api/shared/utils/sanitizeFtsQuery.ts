/**
 * Sanitizes a user-provided query string before passing it to MySQL FULLTEXT
 * MATCH ... AGAINST() in BOOLEAN MODE.
 *
 * Strips the six FTS operator characters: + - * " ( )
 * Trims leading/trailing whitespace and collapses internal runs to a single space.
 *
 * @param query - Raw user input
 * @returns A sanitized string safe for use in AGAINST(? IN BOOLEAN MODE)
 */
export function sanitizeFtsQuery(query: string): string {
  return query
    .replace(/[+\-*"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
