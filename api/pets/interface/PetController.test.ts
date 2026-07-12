/**
 * Supertest tests for PetController routes.
 * Use cases are mocked — no DB connection required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { PetController } from './PetController';
import { createPetRouter } from './petRouter';
import {
  PetNotFoundError,
  PetValidationError,
  PetAlreadyDeletedError,
} from '../domain/PetErrors';
import type { PetSex, PetStatus } from '../domain/Pet';
import type { CreatePetUseCase } from '../application/CreatePet';
import type { GetPetUseCase } from '../application/GetPet';
import type { ListPetsUseCase } from '../application/ListPets';
import type { UpdatePetUseCase } from '../application/UpdatePet';
import type { DeactivatePetUseCase } from '../application/DeactivatePet';
import type { SoftDeletePetUseCase } from '../application/SoftDeletePet';
import type { SearchPetsUseCase } from '../application/SearchPets';

/** Stable domain pet fixture — used in multiple tests */
const domainPet = {
  id: 1,
  client_id: 1,
  name: 'Buddy',
  species: 'Dog',
  breed: 'Golden Retriever',
  sex: 1 as PetSex,
  dateOfBirth: new Date('2020-03-15'),
  weightKg: 28.5,
  notes: null,
  status: 1 as PetStatus,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

/** Expected DTO shape for domainPet */
const expectedDto = {
  id: 1,
  clientId: 1,
  name: 'Buddy',
  species: 'Dog',
  breed: 'Golden Retriever',
  sex: 'male',
  dateOfBirth: '2020-03-15',
  weightKg: 28.5,
  notes: null,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// Mock use case instances with vi.fn()
const mockCreate = { execute: vi.fn() } as unknown as CreatePetUseCase;
const mockGet = { execute: vi.fn() } as unknown as GetPetUseCase;
const mockList = { execute: vi.fn() } as unknown as ListPetsUseCase;
const mockUpdate = { execute: vi.fn() } as unknown as UpdatePetUseCase;
const mockDeactivate = { execute: vi.fn() } as unknown as DeactivatePetUseCase;
const mockSoftDelete = { execute: vi.fn() } as unknown as SoftDeletePetUseCase;
const mockSearch = { execute: vi.fn() } as unknown as SearchPetsUseCase;

const controller = new PetController(
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
  app.use('/api/v1/pets', createPetRouter(controller));
  // Generic error boundary for unexpected throws from middleware
  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/v1/pets', () => {
  it('returns 201 with PetResponseDto on success', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(domainPet);

    const res = await request(makeApp())
      .post('/api/v1/pets')
      .send({ name: 'Buddy', species: 'Dog', breed: 'Golden Retriever', clientId: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(expectedDto);
    expect(res.body).not.toHaveProperty('deletedAt');
  });

  it('returns 422 when name is missing (PetValidationError)', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new PetValidationError('Name is required'),
    );

    const res = await request(makeApp())
      .post('/api/v1/pets')
      .send({ species: 'Dog', clientId: 1 });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(res.body).not.toHaveProperty('stack');
  });

  it('returns 422 when species is missing (PetValidationError)', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new PetValidationError('Species is required'),
    );

    const res = await request(makeApp())
      .post('/api/v1/pets')
      .send({ name: 'Buddy', clientId: 1 });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/v1/pets', () => {
  it('returns 200 with paginated list in { data, meta } shape', async () => {
    (mockList.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [domainPet],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const res = await request(makeApp()).get('/api/v1/pets');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toMatchObject(expectedDto);
    expect(res.body.data[0]).not.toHaveProperty('deletedAt');
    expect(res.body.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
  });

  it('passes page, limit, and clientId to use case', async () => {
    (mockList.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [],
      meta: { total: 0, page: 2, limit: 10, totalPages: 0 },
    });

    await request(makeApp()).get('/api/v1/pets?page=2&limit=10&clientId=5');

    expect(mockList.execute).toHaveBeenCalledWith({ page: 2, limit: 10, clientId: 5 });
  });
});

describe('GET /api/v1/pets/search', () => {
  it('returns 200 with search results', async () => {
    (mockSearch.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce([domainPet]);

    const res = await request(makeApp()).get('/api/v1/pets/search?q=buddy');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject(expectedDto);
    expect(res.body[0]).not.toHaveProperty('deletedAt');
  });

  it('returns 400 when q param is missing', async () => {
    const res = await request(makeApp()).get('/api/v1/pets/search');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 200 with empty array when no results', async () => {
    (mockSearch.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const res = await request(makeApp()).get('/api/v1/pets/search?q=zzznomatch');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/v1/pets/:id', () => {
  it('returns 200 with pet', async () => {
    (mockGet.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(domainPet);

    const res = await request(makeApp()).get('/api/v1/pets/1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(expectedDto);
    expect(res.body).not.toHaveProperty('deletedAt');
  });

  it('returns 404 when not found', async () => {
    (mockGet.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new PetNotFoundError(999),
    );

    const res = await request(makeApp()).get('/api/v1/pets/999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 422 when id is non-numeric', async () => {
    const res = await request(makeApp()).get('/api/v1/pets/abc');

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PUT /api/v1/pets/:id', () => {
  it('returns 200 with updated pet', async () => {
    const updated = { ...domainPet, name: 'Max' };
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(updated);

    const res = await request(makeApp())
      .put('/api/v1/pets/1')
      .send({ name: 'Max' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Max');
  });

  it('returns 404 when pet not found', async () => {
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new PetNotFoundError(999),
    );

    const res = await request(makeApp())
      .put('/api/v1/pets/999')
      .send({ name: 'Updated' });

    expect(res.status).toBe(404);
  });

  it('returns 422 when status field is included in body (forbidden)', async () => {
    const res = await request(makeApp())
      .put('/api/v1/pets/1')
      .send({ name: 'Updated', status: 0 });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/v1/pets/:id/deactivate', () => {
  it('returns 200 with deactivated pet', async () => {
    const deactivated = { ...domainPet, status: 0 as PetStatus };
    (mockDeactivate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(deactivated);

    const res = await request(makeApp()).patch('/api/v1/pets/1/deactivate');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('inactive');
  });

  it('returns 404 when pet not found', async () => {
    (mockDeactivate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new PetNotFoundError(999),
    );

    const res = await request(makeApp()).patch('/api/v1/pets/999/deactivate');

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/pets/:id', () => {
  it('returns 204 no content', async () => {
    (mockSoftDelete.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    const res = await request(makeApp()).delete('/api/v1/pets/1');

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 404 when pet not found', async () => {
    (mockSoftDelete.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new PetNotFoundError(999),
    );

    const res = await request(makeApp()).delete('/api/v1/pets/999');

    expect(res.status).toBe(404);
  });

  it('returns 409 when pet is already deleted', async () => {
    (mockSoftDelete.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new PetAlreadyDeletedError(1),
    );

    const res = await request(makeApp()).delete('/api/v1/pets/1');

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Error handling', () => {
  it('returns 500 without stack trace in body for unexpected errors', async () => {
    (mockGet.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Unexpected database error'),
    );

    const res = await request(makeApp()).get('/api/v1/pets/1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(res.body).not.toHaveProperty('stack');
  });
});
