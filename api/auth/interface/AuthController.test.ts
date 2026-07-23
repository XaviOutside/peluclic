/**
 * Supertest tests for AuthController routes.
 * Use cases are mocked — no DB connection required.
 *
 * Follows the existing ClientController.test.ts pattern:
 *   - Mock use case classes with vi.fn() execute methods
 *   - Create an Express app with the router
 *   - Test all routes and error mappings
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { AuthController } from './AuthController';
import { createAuthRouter } from './authRouter';
import { InvalidCredentialsError } from '../domain/AuthErrors';
import type { LoginUseCase, LoginResult } from '../application/LoginUseCase';
import type { LogoutUseCase } from '../application/LogoutUseCase';

/** Stable login result fixture */
const loginResult: LoginResult = {
  token: '550e8400-e29b-41d4-a716-446655440000',
  user: {
    id: 1,
    email: 'test@example.com',
    role: 0,
    companyId: 1,
    companyName: 'Default Company',
  },
};

/** Expected DTO shape for loginResult */
const loginResponseDto = {
  token: '550e8400-e29b-41d4-a716-446655440000',
  user: {
    id: 1,
    email: 'test@example.com',
    role: 'admin',
    companyId: 1,
    companyName: 'Default Company',
  },
};

// Mock use case instances with vi.fn()
const mockLogin = { execute: vi.fn() } as unknown as LoginUseCase;
const mockLogout = { execute: vi.fn() } as unknown as LogoutUseCase;

const controller = new AuthController(mockLogin, mockLogout);

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', createAuthRouter(controller));
  // Generic error boundary for unexpected throws
  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with LoginResponseDto on success', async () => {
    (mockLogin.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(loginResult);

    const res = await request(makeApp())
      .post('/api/v1/auth/login')
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- test fixture
      .send({ email: 'test@example.com', password: 'test-password-12chars' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(loginResponseDto);
  });

  it('returns 401 when credentials are invalid', async () => {
    (mockLogin.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new InvalidCredentialsError(),
    );

    const res = await request(makeApp())
      .post('/api/v1/auth/login')
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- test fixture
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid email or password' });
    expect(res.body).not.toHaveProperty('stack');
  });

  it('returns 422 when email is empty', async () => {
    (mockLogin.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Email is required'),
    );

    const res = await request(makeApp())
      .post('/api/v1/auth/login')
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- test fixture
      .send({ email: '', password: 'test-password-12chars' });

    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: 'Email is required' });
  });

  it('returns 422 when password is too short', async () => {
    (mockLogin.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Password must be at least 8 characters'),
    );

    const res = await request(makeApp())
      .post('/api/v1/auth/login')
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- test fixture
      .send({ email: 'test@example.com', password: 'short' });

    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: 'Password must be at least 8 characters' });
  });

  it('returns 500 for unexpected errors', async () => {
    (mockLogin.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('DB connection lost'),
    );

    const res = await request(makeApp())
      .post('/api/v1/auth/login')
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- test fixture
      .send({ email: 'test@example.com', password: 'test-password-12chars' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('returns 204 on successful logout', async () => {
    (mockLogout.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    const res = await request(makeApp())
      .post('/api/v1/auth/logout')
      .set('Authorization', 'Bearer 550e8400-e29b-41d4-a716-446655440000');

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 401 when token is missing', async () => {
    const res = await request(makeApp())
      .post('/api/v1/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });
});
