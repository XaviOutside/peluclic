import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
  deactivatePet,
  searchPets,
} from './pet';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const samplePet = {
  id: 1,
  clientId: 10,
  name: 'Max',
  species: 'Dog',
  breed: 'Golden Retriever',
  sex: 'male' as const,
  dateOfBirth: '2020-03-15T00:00:00.000Z',
  weightKg: 32.5,
  notes: 'Friendly, likes treats',
  status: 'active' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('listPets', () => {
  it('returns parsed pet array on success', async () => {
    const pets = [samplePet];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(pets),
    });

    const result = await listPets();
    expect(result).toEqual(pets);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/pets?page=1&limit=20',
      expect.anything(),
    );
  });

  it('passes custom page and limit as query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await listPets(2, 10);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/pets?page=2&limit=10',
      expect.anything(),
    );
  });

  it('adds clientId query param when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await listPets(1, 20, 10);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/pets?page=1&limit=20&clientId=10',
      expect.anything(),
    );
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(listPets()).rejects.toThrow('Network error');
  });
});

describe('getPet', () => {
  it('fetches a single pet by id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(samplePet),
    });

    const result = await getPet(1);
    expect(result).toEqual(samplePet);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/pets/1',
      expect.anything(),
    );
  });

  it('throws 404 error when pet not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Pet not found' }),
    });

    await expect(getPet(999)).rejects.toThrow('Pet not found');
  });
});

describe('createPet', () => {
  it('posts data and returns created pet', async () => {
    const input = { clientId: 10, name: 'Bella', species: 'Dog', breed: 'Labrador' };
    const created = { id: 2, ...input, sex: 'unknown', dateOfBirth: null, weightKg: null, notes: null, status: 'active', createdAt: '', updatedAt: '' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(created),
    });

    const result = await createPet(input);
    expect(result).toEqual(created);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/pets',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('updatePet', () => {
  it('puts data and returns updated pet', async () => {
    const input = { name: 'Maximus' };
    const updated = { ...samplePet, name: 'Maximus' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(updated),
    });

    const result = await updatePet(1, input);
    expect(result).toEqual(updated);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/pets/1',
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});

describe('deletePet', () => {
  it('sends delete and returns void on 204', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => { throw new Error('No body'); },
    });

    const result = await deletePet(1);
    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/pets/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('deactivatePet', () => {
  it('patches deactivate endpoint', async () => {
    const deactivated = { ...samplePet, status: 'inactive' as const };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(deactivated),
    });

    const result = await deactivatePet(1);
    expect(result).toEqual(deactivated);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/pets/1/deactivate',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });
});

describe('searchPets', () => {
  it('calls search endpoint with encoded query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await searchPets('golden retriever');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/pets/search?q=golden%20retriever',
      expect.anything(),
    );
  });
});
