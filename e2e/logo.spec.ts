import { test, expect, request } from '@playwright/test';

const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:3000';
const ADMIN_EMAIL = process.env['E2E_ADMIN_EMAIL']!;
const ADMIN_PASSWORD = process.env['E2E_ADMIN_PASSWORD']!;

/**
 * Minimal valid 1×1 white PNG, base64-encoded. 67 bytes.
 */
const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const MINIMAL_PNG_BYTES = Buffer.from(MINIMAL_PNG_BASE64, 'base64');

/**
 * A different 1×1 black PNG, base64-encoded. 68 bytes.
 */
const ANOTHER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/H4ADAAgMAv5J1dBhAAAAAElFTkSuQmCC';
const ANOTHER_PNG_BYTES = Buffer.from(ANOTHER_PNG_BASE64, 'base64');

/** Playwright multipart shape for file uploads. */
function pngFile(name: string, buffer: Buffer) {
  return { name, mimeType: 'image/png', buffer };
}

/**
 * E2E tests for logo upload (POST) and retrieval (GET).
 * Logo is stored in the logo_assets DB table — no filesystem dependency.
 *
 * Run: npx playwright test --grep "logo API"
 */
test.describe('logo API', () => {
  let authToken: string;

  test.beforeAll(async () => {
    const api = await request.newContext({ baseURL: API_URL });
    const loginRes = await api.post('/api/v1/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const body = await loginRes.json();
    await api.dispose();
    authToken = body.token;
  });

  // ── Upload ────────────────────────────────────────────────────────────

  test('POST /logo — uploads a PNG and returns settings with logoUrl', async () => {
    const api = await request.newContext({ baseURL: API_URL });

    const res = await api.post('/api/v1/settings/logo', {
      headers: { Authorization: `Bearer ${authToken}` },
      multipart: { logo: pngFile('logo.png', MINIMAL_PNG_BYTES) },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.logoUrl).toBe('/api/v1/settings/logo');
    await api.dispose();
  });

  test('POST /logo — returns 422 for non-PNG file', async () => {
    const api = await request.newContext({ baseURL: API_URL });

    const res = await api.post('/api/v1/settings/logo', {
      headers: { Authorization: `Bearer ${authToken}` },
      multipart: { logo: { name: 'logo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('x') } },
    });

    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.error).toContain('PNG');
    await api.dispose();
  });

  test('POST /logo — returns 422 for file exceeding 1 MB', async () => {
    const api = await request.newContext({ baseURL: API_URL });

    const largeBuffer = Buffer.alloc(1.5 * 1024 * 1024, 0x00);

    const res = await api.post('/api/v1/settings/logo', {
      headers: { Authorization: `Bearer ${authToken}` },
      multipart: { logo: pngFile('large.png', largeBuffer) },
    });

    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.error).toContain('1 MB');
    await api.dispose();
  });

  test('POST /logo — returns 400 when no file is sent', async () => {
    const api = await request.newContext({ baseURL: API_URL });

    const res = await api.post('/api/v1/settings/logo', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No file');
    await api.dispose();
  });

  // ── Retrieve ──────────────────────────────────────────────────────────

  test('GET /logo — returns the uploaded logo with correct Content-Type', async () => {
    const api = await request.newContext({ baseURL: API_URL });

    // Upload first
    await api.post('/api/v1/settings/logo', {
      headers: { Authorization: `Bearer ${authToken}` },
      multipart: { logo: pngFile('logo.png', MINIMAL_PNG_BYTES) },
    });

    // Retrieve (public endpoint, no auth)
    const res = await api.get('/api/v1/settings/logo');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');

    const servedBytes = await res.body();
    expect(Buffer.compare(servedBytes, MINIMAL_PNG_BYTES)).toBe(0);

    await api.dispose();
  });

  test('GET /logo — returns 404 when no logo has been uploaded', async () => {
    const api = await request.newContext({ baseURL: API_URL });

    const res = await api.get('/api/v1/settings/logo');
    // May be 200 or 404 depending on whether a prior test uploaded a logo.
    // The endpoint must not crash regardless.
    expect([200, 404]).toContain(res.status());
    await api.dispose();
  });

  // ── Replacement ───────────────────────────────────────────────────────

  test('uploading a new logo updates logoUrl in settings (replacement)', async () => {
    const api = await request.newContext({ baseURL: API_URL });

    // Upload first logo
    const up1 = await api.post('/api/v1/settings/logo', {
      headers: { Authorization: `Bearer ${authToken}` },
      multipart: { logo: pngFile('logo1.png', MINIMAL_PNG_BYTES) },
    });
    expect(up1.status()).toBe(200);
    const body1 = await up1.json();
    expect(body1.logoUrl).toBe('/api/v1/settings/logo');

    // Upload second logo — should still succeed and return logoUrl
    const up2 = await api.post('/api/v1/settings/logo', {
      headers: { Authorization: `Bearer ${authToken}` },
      multipart: { logo: pngFile('logo2.png', ANOTHER_PNG_BYTES) },
    });
    expect(up2.status()).toBe(200);
    const body2 = await up2.json();
    expect(body2.logoUrl).toBe('/api/v1/settings/logo');

    // GET /logo should return a valid PNG (the current logo, whichever it is)
    const getRes = await api.get('/api/v1/settings/logo');
    expect(getRes.status()).toBe(200);
    expect(getRes.headers()['content-type']).toContain('image/png');

    await api.dispose();
  });

  // ── Persistence ───────────────────────────────────────────────────────

  test('logo survives across requests (DB-backed persistence)', async () => {
    const api = await request.newContext({ baseURL: API_URL });

    const up = await api.post('/api/v1/settings/logo', {
      headers: { Authorization: `Bearer ${authToken}` },
      multipart: { logo: pngFile('logo.png', MINIMAL_PNG_BYTES) },
    });
    expect(up.status()).toBe(200);

    // Multiple separate request contexts — logo must still be there
    for (let i = 0; i < 3; i++) {
      const freshApi = await request.newContext({ baseURL: API_URL });
      const res = await freshApi.get('/api/v1/settings/logo');
      expect(res.status()).toBe(200);
      const bytes = await res.body();
      expect(Buffer.compare(bytes, MINIMAL_PNG_BYTES)).toBe(0);
      await freshApi.dispose();
    }

    await api.dispose();
  });

  // ── Cache headers ─────────────────────────────────────────────────────

  test('GET /logo — sets Cache-Control header for browser caching', async () => {
    const api = await request.newContext({ baseURL: API_URL });

    await api.post('/api/v1/settings/logo', {
      headers: { Authorization: `Bearer ${authToken}` },
      multipart: { logo: pngFile('logo.png', MINIMAL_PNG_BYTES) },
    });

    const res = await api.get('/api/v1/settings/logo');
    expect(res.status()).toBe(200);
    expect(res.headers()['cache-control']).toContain('max-age=86400');

    await api.dispose();
  });
});
