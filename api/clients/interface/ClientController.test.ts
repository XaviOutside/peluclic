/**
 * Supertest tests for ClientController routes.
 * Use cases are mocked — no DB connection required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ClientController } from './ClientController';
import { createClientRouter } from './clientRouter';
import {
  ClientNotFoundError,
  ClientValidationError,
  ClientAlreadyDeletedError,
} from '../domain/ClientErrors';
import type { CreateClientUseCase } from '../application/CreateClient';
import type { GetClientUseCase } from '../application/GetClient';
import type { ListClientsUseCase } from '../application/ListClients';
import type { UpdateClientUseCase } from '../application/UpdateClient';
import type { DeactivateClientUseCase } from '../application/DeactivateClient';
import type { ReactivateClientUseCase } from '../application/ReactivateClient';
import type { SoftDeleteClientUseCase } from '../application/SoftDeleteClient';
import type { SearchClientsUseCase } from '../application/SearchClients';

/** Stable domain client fixture — used in multiple tests */
const domainClient = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0001',
  phone2: null,
  address: null,
  status: 1 as const,
  lastServiceDate: null,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

/** Expected DTO shape for domainClient */
const expectedDto = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0001',
  phone2: null,
  address: null,
  status: 'active',
  lastServiceDate: null,
  notes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// Mock use case instances with vi.fn()
const mockCreate = { execute: vi.fn() } as unknown as CreateClientUseCase;
const mockGet = { execute: vi.fn() } as unknown as GetClientUseCase;
const mockList = { execute: vi.fn() } as unknown as ListClientsUseCase;
const mockUpdate = { execute: vi.fn() } as unknown as UpdateClientUseCase;
const mockDeactivate = { execute: vi.fn() } as unknown as DeactivateClientUseCase;
const mockReactivate = { execute: vi.fn() } as unknown as ReactivateClientUseCase;
const mockSoftDelete = { execute: vi.fn() } as unknown as SoftDeleteClientUseCase;
const mockSearch = { execute: vi.fn() } as unknown as SearchClientsUseCase;

const controller = new ClientController(
  mockCreate,
  mockGet,
  mockList,
  mockUpdate,
  mockDeactivate,
  mockReactivate,
  mockSoftDelete,
  mockSearch,
);

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/clients', createClientRouter(controller));
  // Generic error boundary for unexpected throws from middleware
  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/v1/clients', () => {
  it('returns 201 with ClientResponseDto on success', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(domainClient);

    const res = await request(makeApp())
      .post('/api/v1/clients')
      .send({ name: 'John Doe', email: 'john@example.com', phone: '555-0001' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(expectedDto);
    expect(res.body).not.toHaveProperty('deletedAt');
  });

  it('returns 422 when name is missing (ClientValidationError)', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ClientValidationError('Name is required'),
    );

    const res = await request(makeApp())
      .post('/api/v1/clients')
      .send({ email: 'john@example.com', phone: '555-0001' });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(res.body).not.toHaveProperty('stack');
  });

  it('returns 422 when email is invalid (ClientValidationError)', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ClientValidationError('Email must be a valid email address'),
    );

    const res = await request(makeApp())
      .post('/api/v1/clients')
      .send({ name: 'John Doe', email: 'not-an-email', phone: '555-0001' });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/v1/clients', () => {
  it('returns 200 with paginated list in { data, meta } shape', async () => {
    (mockList.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [domainClient],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const res = await request(makeApp()).get('/api/v1/clients');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toMatchObject(expectedDto);
    expect(res.body.data[0]).not.toHaveProperty('deletedAt');
    expect(res.body.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
  });

  it('respects page and limit query params', async () => {
    (mockList.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [],
      meta: { total: 0, page: 2, limit: 10, totalPages: 0 },
    });

    const res = await request(makeApp()).get('/api/v1/clients?page=2&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.limit).toBe(10);
  });
});

describe('GET /api/v1/clients/search', () => {
  it('returns 200 with search results', async () => {
    (mockSearch.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce([domainClient]);

    const res = await request(makeApp()).get('/api/v1/clients/search?q=john');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject(expectedDto);
    expect(res.body[0]).not.toHaveProperty('deletedAt');
  });

  it('returns 400 when q param is missing', async () => {
    const res = await request(makeApp()).get('/api/v1/clients/search');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 200 with empty array when no results', async () => {
    (mockSearch.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const res = await request(makeApp()).get('/api/v1/clients/search?q=zzznomatch');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/v1/clients/:id', () => {
  it('returns 200 with client', async () => {
    (mockGet.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(domainClient);

    const res = await request(makeApp()).get('/api/v1/clients/1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(expectedDto);
    expect(res.body).not.toHaveProperty('deletedAt');
  });

  it('returns 404 when not found', async () => {
    (mockGet.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ClientNotFoundError(999),
    );

    const res = await request(makeApp()).get('/api/v1/clients/999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 422 when id is non-numeric', async () => {
    const res = await request(makeApp()).get('/api/v1/clients/abc');

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PUT /api/v1/clients/:id', () => {
  it('returns 200 with updated client', async () => {
    const updated = { ...domainClient, name: 'Jane Doe' };
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(updated);

    const res = await request(makeApp())
      .put('/api/v1/clients/1')
      .send({ name: 'Jane Doe' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Jane Doe');
  });

  it('returns 404 when client not found', async () => {
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ClientNotFoundError(999),
    );

    const res = await request(makeApp())
      .put('/api/v1/clients/999')
      .send({ name: 'Updated' });

    expect(res.status).toBe(404);
  });

  it('returns 422 when status field is included in body (forbidden)', async () => {
    const res = await request(makeApp())
      .put('/api/v1/clients/1')
      .send({ name: 'Updated', status: 0 });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/v1/clients/:id/deactivate', () => {
  it('returns 200 with deactivated client', async () => {
    const deactivated = { ...domainClient, status: 0 as const };
    (mockDeactivate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(deactivated);

    const res = await request(makeApp()).patch('/api/v1/clients/1/deactivate');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('inactive');
  });

  it('returns 404 when client not found', async () => {
    (mockDeactivate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ClientNotFoundError(999),
    );

    const res = await request(makeApp()).patch('/api/v1/clients/999/deactivate');

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/clients/:id', () => {
  it('returns 204 no content', async () => {
    (mockSoftDelete.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    const res = await request(makeApp()).delete('/api/v1/clients/1');

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 404 when client not found', async () => {
    (mockSoftDelete.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ClientNotFoundError(999),
    );

    const res = await request(makeApp()).delete('/api/v1/clients/999');

    expect(res.status).toBe(404);
  });

  it('returns 409 when client is already deleted', async () => {
    (mockSoftDelete.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ClientAlreadyDeletedError(1),
    );

    const res = await request(makeApp()).delete('/api/v1/clients/1');

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Error handling', () => {
  it('returns 500 without stack trace in body for unexpected errors', async () => {
    (mockGet.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Unexpected database error'),
    );

    const res = await request(makeApp()).get('/api/v1/clients/1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(res.body).not.toHaveProperty('stack');
  });
});
