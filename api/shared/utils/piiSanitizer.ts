/**
 * PII Sanitization utilities for GDPR Art. 32 compliance.
 *
 * - sanitizeUrl: strips query parameters from logged URLs
 * - sanitizeLogPayload: redacts PII fields (name, email, phone) from log data
 */

const PII_FIELDS = new Set(['name', 'email', 'phone', 'phone2']);
const REDACTED = '[REDACTED]';

/**
 * Strips the query string (everything after and including `?`) from a URL.
 * Useful for request logging to prevent PII in query parameters from being logged.
 *
 * Examples:
 *   "/search?q=Juan+Pérez" → "/search"
 *   "/api/v1/clients"       → "/api/v1/clients"
 *   ""                      → ""
 */
export function sanitizeUrl(url: string): string {
  if (!url) return url;
  const qIndex = url.indexOf('?');
  return qIndex === -1 ? url : url.slice(0, qIndex);
}

/**
 * Deeply redacts PII fields (name, email, phone, phone2) from a log payload,
 * replacing their values with "[REDACTED]".
 *
 * Returns a new object — never mutates the input.
 * Recursively processes nested objects (e.g., Sentry breadcrumb `data`).
 *
 * @param obj - The log payload to sanitize. Null/undefined are returned as-is.
 * @returns A new object with PII fields redacted.
 */
export function sanitizeLogPayload<T extends Record<string, unknown> | null | undefined>(
  obj: T,
): T {
  if (obj == null) return obj;

  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (PII_FIELDS.has(key)) {
      result[key] = REDACTED;
    } else if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeLogPayload(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
