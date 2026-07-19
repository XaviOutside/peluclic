/**
 * SANE (Sanity And Neutral Execution) validators for FTS operations.
 *
 * These runtime guards validate the shape of raw $queryRaw output and the
 * invariants of FTS queries before they reach the database, providing an
 * extra defense-in-depth layer beyond TypeScript types.
 */

/** Maximum number of result rows allowed from an FTS query. */
const MAX_FTS_RESULTS = 10_000;

/** Characters that MUST NOT appear in a NATURAL LANGUAGE MODE FTS query. */
const FORBIDDEN_QUERY_CHARS = /["+\-*()]/;

/**
 * Validates that a raw `$queryRaw` result conforms to the expected shape:
 * an array of objects with a single `id` key whose value is a positive integer.
 *
 * Throws `SANE_ERROR` on validation failure.
 *
 * @param result - Raw output from `$queryRaw` (e.g., `SELECT id FROM ...`)
 */
export function saneValidateFtsOutput(result: unknown): asserts result is Array<{ id: number }> {
  if (!Array.isArray(result)) {
    throw new Error(
      `SANE_ERROR: expected FTS result to be an array, got ${typeof result}`,
    );
  }

  if (result.length > MAX_FTS_RESULTS) {
    throw new Error(
      `SANE_ERROR: FTS result exceeds max rows (${result.length} > ${MAX_FTS_RESULTS})`,
    );
  }

  for (let i = 0; i < result.length; i++) {
    const row = result[i];

    if (row === null || typeof row !== 'object') {
      throw new Error(
        `SANE_ERROR: expected FTS result row to be an object, got ${typeof row} at index ${i}`,
      );
    }

    if (!('id' in row)) {
      throw new Error(
        `SANE_ERROR: FTS result row missing 'id' key at index ${i}. Got keys: ${Object.keys(row).join(', ') || 'none'}`,
      );
    }

    const id = (row as Record<string, unknown>).id;

    if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0 || !Number.isInteger(id)) {
      throw new Error(
        `SANE_ERROR: FTS result row 'id' must be a positive integer, got ${typeof id} ${id} at index ${i}`,
      );
    }
  }
}

/**
 * Validates that a sanitized FTS query meets safety invariants before
 * execution. Rejects queries containing FTS operators or with length < 3
 * characters (unless empty, which is allowed as a no-op).
 *
 * Throws `SANE_ERROR` on validation failure.
 *
 * @param query - Sanitized query string (already normalized by sanitizeFtsQuery)
 */
export function saneValidateQuery(query: string): void {
  // Empty queries are allowed (they bypass FTS entirely via the 3-char gate)
  if (query.length === 0) {
    return;
  }

  if (FORBIDDEN_QUERY_CHARS.test(query)) {
    throw new Error(
      `SANE_ERROR: query contains forbidden FTS operator characters: "${query}"`,
    );
  }

  if (query.length < 3) {
    throw new Error(
      `SANE_ERROR: query must be at least 3 characters or empty, got "${query}" (${query.length} chars)`,
    );
  }
}
