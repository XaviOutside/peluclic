/**
 * Integration tests for the full auth HTTP layer.
 * @integration — requires Docker MySQL running with seed data (npm run test:integration)
 *
 * Tests verify the complete auth flow:
 * - Login with valid credentials → 200 + token
 * - Login with wrong password → 401 (uniform message)
 * - Login with short password → 422
 * - Logout → 204
 * - Protected routes without token → 401
 * - Protected routes with valid token → 200
 * - Token invalidation after logout → 401
 */
import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';

// Prevent the server from starting in the test process
process.env['NODE_ENV'] = 'test';

let app: import('express').Application;
let request: supertest.SuperTest<supertest.Test>;

// Seed credentials — must match prisma/seed.ts
const SEED_EMAIL = process.env['SEED_ADMIN_EMAIL'];
const SEED_PASSWORD = process.env['SEED_ADMIN_PASSWORD'];

if (!SEED_EMAIL || !SEED_PASSWORD) {
  throw new Error(
    'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env for integration tests',
  );
}
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- test fixture
const INVALID_PASSWORD = 'wrongpassword123456';

beforeAll(async () => {
  // Dynamic import to defer resolution to test execution time
  const module = await import('../../index');
  app = module.app;
  request = supertest(app);
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with token and user for valid seed credentials', async () => {
    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: SEED_EMAIL, password: SEED_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({
      email: SEED_EMAIL,
      role: 'admin',
    });
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('companyId');
    expect(res.body.user).toHaveProperty('companyName');
  });

  it('returns 401 with uniform message for wrong password', async () => {
    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: SEED_EMAIL, password: INVALID_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid email or password' });
    // The message is deliberately uniform — same for wrong email, wrong password, or unknown email.
    // This prevents user enumeration. The words "email" and "password" appear as part of
    // the generic phrase "Invalid email or password" — they do NOT disclose which field failed.
    expect(res.body).not.toHaveProperty('stack');
  });

  it('returns 422 when password is less than 8 characters', async () => {
    const res = await request
      .post('/api/v1/auth/login')
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- test fixture
      .send({ email: SEED_EMAIL, password: 'short' });

    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: 'Password must be at least 8 characters' });
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('returns 204 for a valid token', async () => {
    // First, login to get a valid token
    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({ email: SEED_EMAIL, password: SEED_PASSWORD });
    const token = loginRes.body.token;

    // Then logout
    const res = await request
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request.post('/api/v1/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });
});

describe('Auth middleware — protected routes', () => {
  it('returns 401 when accessing /api/v1/clients without token', async () => {
    const res = await request.get('/api/v1/clients');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 200 when accessing /api/v1/clients with valid token', async () => {
    // Login
    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({ email: SEED_EMAIL, password: SEED_PASSWORD });
    const token = loginRes.body.token;

    // Access protected route
    const res = await request
      .get('/api/v1/clients')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('token is invalidated after logout — same token returns 401', async () => {
    // Login
    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({ email: SEED_EMAIL, password: SEED_PASSWORD });
    const token = loginRes.body.token;

    // Logout
    await request
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    // Same token should now be rejected
    const res = await request
      .get('/api/v1/clients')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });
});
