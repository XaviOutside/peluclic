import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClient } from './useClient';

const mockClient = {
  id: 42,
  name: 'Alice',
  email: 'alice@example.com',
  phone: '555-0101',
  phone2: null,
  address: null,
  status: 'active' as const,
  lastServiceDate: null,
  notes: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('useClient', () => {
  it('fetches client by id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockClient),
    });

    const { result } = renderHook(() => useClient(42));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.client).toEqual(mockClient);
    expect(result.current.error).toBeNull();
  });

  it('handles 404 (client not found)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Client not found' }),
    });

    const { result } = renderHook(() => useClient(999));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.client).toBeNull();
    expect(result.current.error).toBe('Client not found');
  });

  it('returns null client when no id provided', () => {
    const { result } = renderHook(() => useClient(undefined));

    expect(result.current.client).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('re-fetches when id changes', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockClient),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ...mockClient, id: 43, name: 'Bob' }),
      });

    const { result, rerender } = renderHook(
      (id: number | undefined) => useClient(id),
      { initialProps: 42 },
    );

    await waitFor(() => expect(result.current.client?.id).toBe(42));

    // Change id
    rerender(43);

    await waitFor(() => expect(result.current.client?.id).toBe(43));
    expect(result.current.client?.name).toBe('Bob');
  });
});
