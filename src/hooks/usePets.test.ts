import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePets } from './usePets';

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

const mockPets = [
  samplePet,
  { ...samplePet, id: 2, name: 'Bella', breed: 'Labrador' },
];

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('usePets', () => {
  it('starts in loading state', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    const { result } = renderHook(() => usePets());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.pets).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.page).toBe(1);
  });

  it('fetches and returns pets on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockPets),
    });

    const { result } = renderHook(() => usePets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.pets).toEqual(mockPets);
    expect(result.current.error).toBeNull();
    expect(result.current.page).toBe(1);
  });

  it('handles fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const { result } = renderHook(() => usePets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.pets).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it('goToPage triggers a new fetch with the correct page param', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockPets),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([samplePet]),
    });

    const { result } = renderHook(() => usePets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.goToPage(3);
    });

    await waitFor(() => expect(result.current.page).toBe(3));

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/pets?page=3&limit=20',
      expect.anything(),
    );
  });

  it('setClientId resets to page 1 and fetches with client_id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockPets),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([samplePet]),
    });

    const { result } = renderHook(() => usePets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setClientId(10);
    });

    await waitFor(() => expect(result.current.clientId).toBe(10));
    expect(result.current.page).toBe(1);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/pets?page=1&limit=20&client_id=10',
      expect.anything(),
    );
  });

  it('refresh re-fetches current page', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockPets),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([samplePet]),
    });

    const { result } = renderHook(() => usePets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.pets).toEqual([samplePet]));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/v1/pets?page=1&limit=20',
      expect.anything(),
    );
  });
});
