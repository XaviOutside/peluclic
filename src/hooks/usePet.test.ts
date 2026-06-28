import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePet } from './usePet';

const samplePet = {
  id: 1,
  clientId: 10,
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

describe('usePet', () => {
  it('fetches pet by id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(samplePet),
    });

    const { result } = renderHook(() => usePet(1));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.pet).toEqual(samplePet);
    expect(result.current.error).toBeNull();
  });

  it('handles 404 (pet not found)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Pet not found' }),
    });

    const { result } = renderHook(() => usePet(999));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.pet).toBeNull();
    expect(result.current.error).toBe('Pet not found');
  });

  it('returns null pet when no id provided', () => {
    const { result } = renderHook(() => usePet(undefined));

    expect(result.current.pet).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('re-fetches when id changes', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(samplePet),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ...samplePet, id: 2, name: 'Bella' }),
      });

    const { result, rerender } = renderHook(
      (id: number | undefined) => usePet(id),
      { initialProps: 1 },
    );

    await waitFor(() => expect(result.current.pet?.id).toBe(1));

    rerender(2);

    await waitFor(() => expect(result.current.pet?.id).toBe(2));
    expect(result.current.pet?.name).toBe('Bella');
  });
});
