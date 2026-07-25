import { describe, it, expect } from 'vitest';
import { sanitizeUrl, sanitizeLogPayload } from './piiSanitizer';

describe('sanitizeUrl', () => {
  it('strips query string from URL', () => {
    expect(sanitizeUrl('/search?q=Juan+Pérez&page=1')).toBe('/search');
  });

  it('returns same URL when no query params', () => {
    expect(sanitizeUrl('/api/v1/clients')).toBe('/api/v1/clients');
  });

  it('handles URL with only question mark (no params)', () => {
    expect(sanitizeUrl('/path?')).toBe('/path');
  });

  it('strips complex query strings with special chars', () => {
    expect(sanitizeUrl('/api?email=user@test.com&name=John+Doe')).toBe('/api');
  });

  it('returns empty string unchanged', () => {
    expect(sanitizeUrl('')).toBe('');
  });

  it('preserves URL path with hash fragment (fragment is not a query param)', () => {
    const result = sanitizeUrl('/page#section');
    // Fragment is not stripped by our sanitizer (only ?query is stripped)
    expect(result).toBe('/page#section');
  });

  it('strips query even when URL has hash after query', () => {
    expect(sanitizeUrl('/page?q=test#section')).toBe('/page');
  });

  it('handles full URL with protocol', () => {
    expect(sanitizeUrl('https://example.com/api?token=abc123')).toBe('https://example.com/api');
  });
});

describe('sanitizeLogPayload', () => {
  it('redacts email field', () => {
    const input = { email: 'user@example.com', action: 'login' };
    const result = sanitizeLogPayload(input);
    expect(result.email).toBe('[REDACTED]');
    expect(result.action).toBe('login');
  });

  it('redacts name field', () => {
    const input = { name: 'Juan Pérez', id: 42 };
    const result = sanitizeLogPayload(input);
    expect(result.name).toBe('[REDACTED]');
    expect(result.id).toBe(42);
  });

  it('redacts phone field', () => {
    const input = { phone: '+1 (555) 123-4567', type: 'mobile' };
    const result = sanitizeLogPayload(input);
    expect(result.phone).toBe('[REDACTED]');
    expect(result.type).toBe('mobile');
  });

  it('redacts phone2 field (secondary phone)', () => {
    const input = { phone2: '+1 (555) 987-6543', name: 'Jane' };
    const result = sanitizeLogPayload(input);
    expect(result.phone2).toBe('[REDACTED]');
    expect(result.name).toBe('[REDACTED]');
  });

  it('redacts all PII fields in a single object', () => {
    const input = {
      name: 'Alice',
      email: 'alice@test.com',
      phone: '555-0001',
      phone2: '555-0002',
      company: 'Acme Inc',
      method: 'POST',
      url: '/api/v1/clients',
    };
    const result = sanitizeLogPayload(input);
    expect(result.name).toBe('[REDACTED]');
    expect(result.email).toBe('[REDACTED]');
    expect(result.phone).toBe('[REDACTED]');
    expect(result.phone2).toBe('[REDACTED]');
    expect(result.company).toBe('Acme Inc');
    expect(result.method).toBe('POST');
    expect(result.url).toBe('/api/v1/clients');
  });

  it('leaves object unchanged when no PII fields present', () => {
    const input = { method: 'GET', url: '/health', status: 200 };
    const result = sanitizeLogPayload(input);
    expect(result).toEqual(input);
  });

  it('handles empty object', () => {
    const result = sanitizeLogPayload({});
    expect(result).toEqual({});
  });

  it('returns a new object (does not mutate input)', () => {
    const input = { name: 'Bob', email: 'bob@test.com' };
    const result = sanitizeLogPayload(input);
    expect(result).not.toBe(input);
    expect(input.name).toBe('Bob'); // original unchanged
    expect(input.email).toBe('bob@test.com');
  });

  it('redacts PII in nested data object (Sentry breadcrumb data)', () => {
    const input = {
      category: 'log',
      message: 'client search',
      data: {
        name: 'Charlie',
        email: 'charlie@test.com',
        phone: '555-9999',
        query: 'golden retriever',
      },
    };
    const result = sanitizeLogPayload(input);
    expect(result.data.name).toBe('[REDACTED]');
    expect(result.data.email).toBe('[REDACTED]');
    expect(result.data.phone).toBe('[REDACTED]');
    expect(result.data.query).toBe('golden retriever');
  });

  it('handles null gracefully', () => {
    const result = sanitizeLogPayload(null as unknown as Record<string, unknown>);
    expect(result).toBeNull();
  });

  it('handles undefined gracefully', () => {
    const result = sanitizeLogPayload(undefined as unknown as Record<string, unknown>);
    expect(result).toBeUndefined();
  });
});
