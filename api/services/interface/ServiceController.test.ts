/**
 * Supertest tests for ServiceController routes.
 * Use cases are mocked — no DB connection required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ServiceController } from './ServiceController';
import { createServiceRouter } from './serviceRouter';
import { NotFoundError, ValidationError, AlreadyDeletedError } from '@api/shared/domain/errors';
import type { ServiceStatus } from '../domain/Service';
import type { CreateServiceUseCase } from '../application/CreateService';
import type { GetServiceUseCase } from '../application/GetService';
import type { ListServicesUseCase } from '../application/ListServices';
import type { UpdateServiceUseCase } from '../application/UpdateService';
import type { DeactivateServiceUseCase } from '../application/DeactivateService';
import type { SoftDeleteServiceUseCase } from '../application/SoftDeleteService';
import type { SearchServicesUseCase } from '../application/SearchServices';

/** Stable domain service fixture */
const domainService = {
  id: 1,
  name: 'Full Groom',
  description: 'Complete grooming package',
  durationMinutes: 60,
  price: 5000,
  petId: null,
  status: 1 as ServiceStatus,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

/** Expected DTO shape */
const expectedDto = {
  id: 1,
  name: 'Full Groom',
  description: 'Complete grooming package',
  durationMinutes: 60,
  price: 50.00,
  petId: null,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// Mock use cases
const mockCreate = { execute: vi.fn() } as unknown as CreateServiceUseCase;
const mockGet = { execute: vi.fn() } as unknown as GetServiceUseCase;
const mockList = { execute: vi.fn() } as unknown as ListServicesUseCase;
const mockUpdate = { execute: vi.fn() } as unknown as UpdateServiceUseCase;
const mockDeactivate = { execute: vi.fn() } as unknown as DeactivateServiceUseCase;
const mockSoftDelete = { execute: vi.fn() } as unknown as SoftDeleteServiceUseCase;
const mockSearch = { execute: vi.fn() } as unknown as SearchServicesUseCase;

const controller = new ServiceController(
  mockCreate,
  mockGet,
  mockList,
  mockUpdate,
  mockDeactivate,
  mockSoftDelete,
  mockSearch,
);

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/services', createServiceRouter(controller));
  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/v1/services', () => {
  it('returns 201 with ServiceResponseDto on success', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(domainService);

    const res = await request(makeApp())
      .post('/api/v1/services')
      .send({ name: 'Full Groom', price: 50 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(expectedDto);
    expect(mockCreate.execute).toHaveBeenCalledWith({
      name: 'Full Groom',
      price: 5000,
    });
  });

  it('converts dollars to cents for price', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...domainService,
      price: 4999,
    });

    const res = await request(makeApp())
      .post('/api/v1/services')
      .send({ name: 'Test', price: 49.99 });

    expect(res.status).toBe(201);
    expect(res.body.price).toBe(49.99);
    expect(mockCreate.execute).toHaveBeenCalledWith({
      name: 'Test',
      price: 4999,
    });
  });

  it('returns 422 on missing name (ValidationError)', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ValidationError('Name is required'),
    );

    const res = await request(makeApp())
      .post('/api/v1/services')
      .send({ price: 50 });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Name is required');
  });

  it('returns 422 on negative price', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ValidationError('Price must be a non-negative integer'),
    );

    const res = await request(makeApp())
      .post('/api/v1/services')
      .send({ name: 'Test', price: -10 });

    expect(res.status).toBe(422);
  });

  it('passes petId through to use case on create', async () => {
    const withPet = { ...domainService, petId: 5 };
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(withPet);

    const res = await request(makeApp())
      .post('/api/v1/services')
      .send({ name: 'Pet Groom', price: 50, petId: 5 });

    expect(res.status).toBe(201);
    expect(res.body.petId).toBe(5);
    expect(mockCreate.execute).toHaveBeenCalledWith({
      name: 'Pet Groom',
      price: 5000,
      petId: 5,
    });
  });
});

describe('GET /api/v1/services/search', () => {
  it('returns 200 with matching services', async () => {
    (mockSearch.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce([domainService]);

    const res = await request(makeApp()).get('/api/v1/services/search?q=groom');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toEqual(expectedDto);
    expect(mockSearch.execute).toHaveBeenCalledWith({ query: 'groom' });
  });

  it('returns 400 when q parameter is missing', async () => {
    const res = await request(makeApp()).get('/api/v1/services/search');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Query parameter 'q' is required");
  });

  it('returns 400 when q parameter is empty', async () => {
    const res = await request(makeApp()).get('/api/v1/services/search?q=');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Query parameter 'q' is required");
  });
});

describe('GET /api/v1/services', () => {
  it('returns 200 with paginated services in { data, meta } shape', async () => {
    (mockList.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [domainService],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const res = await request(makeApp()).get('/api/v1/services');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toEqual(expectedDto);
    expect(res.body.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
  });

  it('passes page and limit query params', async () => {
    (mockList.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [],
      meta: { total: 0, page: 2, limit: 10, totalPages: 0 },
    });

    await request(makeApp()).get('/api/v1/services?page=2&limit=10');

    expect(mockList.execute).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });

  it('passes petId query param to list use case', async () => {
    (mockList.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    await request(makeApp()).get('/api/v1/services?petId=5');

    expect(mockList.execute).toHaveBeenCalledWith({ petId: 5 });
  });
});

describe('GET /api/v1/services/:id', () => {
  it('returns 200 with ServiceResponseDto', async () => {
    (mockGet.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(domainService);

    const res = await request(makeApp()).get('/api/v1/services/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expectedDto);
  });

  it('returns 404 when service not found', async () => {
    (mockGet.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new NotFoundError('Service', 999),
    );

    const res = await request(makeApp()).get('/api/v1/services/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Service with id 999 not found');
  });

  it('returns 422 for invalid :id param', async () => {
    const res = await request(makeApp()).get('/api/v1/services/abc');

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Invalid id — must be a positive integer');
  });

  it('returns 422 for non-positive :id', async () => {
    const res = await request(makeApp()).get('/api/v1/services/0');

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Invalid id — must be a positive integer');
  });
});

describe('PUT /api/v1/services/:id', () => {
  it('returns 200 with updated service', async () => {
    const updated = { ...domainService, name: 'Deluxe', price: 7500 };
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(updated);

    const res = await request(makeApp())
      .put('/api/v1/services/1')
      .send({ name: 'Deluxe', price: 75 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Deluxe');
    expect(res.body.price).toBe(75.00);

    // Verify dollars→cents conversion
    expect(mockUpdate.execute).toHaveBeenCalledWith(1, {
      name: 'Deluxe',
      price: 7500,
    });
  });

  it('returns 422 when status field is included', async () => {
    const res = await request(makeApp())
      .put('/api/v1/services/1')
      .send({ status: 0 });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('status field is not allowed in PUT. Use PATCH /:id/deactivate instead.');
  });

  it('returns 404 when service not found', async () => {
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new NotFoundError('Service', 999),
    );

    const res = await request(makeApp())
      .put('/api/v1/services/999')
      .send({ name: 'Test' });

    expect(res.status).toBe(404);
  });

  it('passes petId through to update use case for linking', async () => {
    const linked = { ...domainService, petId: 5 };
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(linked);

    const res = await request(makeApp())
      .put('/api/v1/services/1')
      .send({ petId: 5 });

    expect(res.status).toBe(200);
    expect(res.body.petId).toBe(5);
    expect(mockUpdate.execute).toHaveBeenCalledWith(1, {
      petId: 5,
    });
  });

  it('passes petId: null through to update use case for unlinking', async () => {
    const unlinked = { ...domainService, petId: null };
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(unlinked);

    const res = await request(makeApp())
      .put('/api/v1/services/1')
      .send({ petId: null });

    expect(res.status).toBe(200);
    expect(res.body.petId).toBeNull();
    expect(mockUpdate.execute).toHaveBeenCalledWith(1, {
      petId: null,
    });
  });
});

describe('PATCH /api/v1/services/:id/deactivate', () => {
  it('returns 200 with deactivated service', async () => {
    const deactivated = { ...domainService, status: 0 as ServiceStatus };
    (mockDeactivate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(deactivated);

    const res = await request(makeApp()).patch('/api/v1/services/1/deactivate');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('inactive');
  });

  it('returns 404 when service not found', async () => {
    (mockDeactivate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new NotFoundError('Service', 999),
    );

    const res = await request(makeApp()).patch('/api/v1/services/999/deactivate');

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/services/:id', () => {
  it('returns 204 on successful soft-delete', async () => {
    (mockSoftDelete.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    const res = await request(makeApp()).delete('/api/v1/services/1');

    expect(res.status).toBe(204);
  });

  it('returns 409 when already deleted', async () => {
    (mockSoftDelete.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new AlreadyDeletedError('Service', 1),
    );

    const res = await request(makeApp()).delete('/api/v1/services/1');

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Service with id 1 is already deleted');
  });

  it('returns 404 when service not found', async () => {
    (mockSoftDelete.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new NotFoundError('Service', 999),
    );

    const res = await request(makeApp()).delete('/api/v1/services/999');

    expect(res.status).toBe(404);
  });
});

describe('Unknown errors', () => {
  it('returns 500 for unexpected errors', async () => {
    (mockGet.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Boom'));

    const res = await request(makeApp()).get('/api/v1/services/1');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});
