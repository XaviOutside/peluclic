import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useReactivateClient,
  useDeactivateClient,
} from './useClientMutations';

const mockClient = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  phone: '555-0101',
  phone2: null,
  address: null,
  status: 'active' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('useCreateClient', () => {
  it('creates a client and returns it', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(mockClient),
    });

    const { result } = renderHook(() => useCreateClient());

    let created;
    await act(async () => {
      created = await result.current.mutate({
        name: 'Alice',
        email: 'alice@example.com',
        phone: '555-0101',
      });
    });

    expect(created).toEqual(mockClient);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles create failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({
          error: 'Email already exists',
          fieldErrors: { email: 'Email already in use' },
        }),
    });

    const { result } = renderHook(() => useCreateClient());

    await act(async () => {
      try {
        await result.current.mutate({
          name: 'Alice',
          email: 'existing@example.com',
          phone: '555-0101',
        });
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Email already exists');
  });
});

describe('useDeactivateClient', () => {
  it('deactivates a client', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...mockClient, status: 'inactive' }),
    });

    const { result } = renderHook(() => useDeactivateClient());

    await act(async () => {
      await result.current.mutate(1);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useReactivateClient', () => {
  it('reactivates a client', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...mockClient, status: 'active' }),
    });

    const { result } = renderHook(() => useReactivateClient());

    await act(async () => {
      await result.current.mutate(1);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useDeleteClient', () => {
  it('deletes a client', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => { throw new Error('No body'); },
    });

    const { result } = renderHook(() => useDeleteClient());

    await act(async () => {
      await result.current.mutate(1);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useUpdateClient', () => {
  it('updates a client', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...mockClient, name: 'Updated Alice' }),
    });

    const { result } = renderHook(() => useUpdateClient());

    let updated;
    await act(async () => {
      updated = await result.current.mutate(1, { name: 'Updated Alice' });
    });

    expect(updated?.name).toBe('Updated Alice');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
