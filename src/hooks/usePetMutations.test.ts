import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useCreatePet,
  useUpdatePet,
  useDeletePet,
  useDeactivatePet,
} from './usePetMutations';

const samplePet = {
  id: 1,
  client_id: 10,
  name: 'Max',
  species: 'Dog',
  breed: 'Golden Retriever',
  sex: 'male' as const,
  dateOfBirth: '2020-03-15T00:00:00.000Z',
  weightKg: 32.5,
  notes: 'Friendly',
  status: 'active' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('useCreatePet', () => {
  it('creates a pet and returns it', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(samplePet),
    });

    const { result } = renderHook(() => useCreatePet());

    let created;
    await act(async () => {
      created = await result.current.mutate({
        client_id: 10,
        name: 'Max',
        species: 'Dog',
        breed: 'Golden Retriever',
      });
    });

    expect(created).toEqual(samplePet);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles create failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({
          error: 'Invalid client',
          fieldErrors: { client_id: 'Client does not exist or is inactive' },
        }),
    });

    const { result } = renderHook(() => useCreatePet());

    await act(async () => {
      try {
        await result.current.mutate({
          client_id: 999,
          name: 'Ghost',
          species: 'Dog',
          breed: 'Unknown',
        });
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Invalid client');
  });
});

describe('useUpdatePet', () => {
  it('updates a pet', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...samplePet, name: 'Maximus' }),
    });

    const { result } = renderHook(() => useUpdatePet());

    let updated;
    await act(async () => {
      updated = await result.current.mutate(1, { name: 'Maximus' });
    });

    expect(updated?.name).toBe('Maximus');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useDeletePet', () => {
  it('deletes a pet', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => {
        throw new Error('No body');
      },
    });

    const { result } = renderHook(() => useDeletePet());

    await act(async () => {
      await result.current.mutate(1);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useDeactivatePet', () => {
  it('deactivates a pet', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...samplePet, status: 'inactive' }),
    });

    const { result } = renderHook(() => useDeactivatePet());

    await act(async () => {
      await result.current.mutate(1);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
