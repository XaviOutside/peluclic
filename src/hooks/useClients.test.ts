import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useClients } from './useClients';

const mockClients = [
  { id: 1, name: 'Alice', email: 'alice@example.com', phone: '555-0101', phone2: null, address: null, status: 'active', lastServiceDate: null, notes: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Bob', email: 'bob@example.com', phone: '555-0102', phone2: null, address: null, status: 'inactive', lastServiceDate: null, notes: null, createdAt: '2024-01-02T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' },
];

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('useClients', () => {
  it('starts in loading state with pagination defaults', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
    });

    const { result } = renderHook(() => useClients());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.clients).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalPages).toBe(0);
  });

  it('fetches and returns clients on mount with pagination metadata', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockClients, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }),
    });

    const { result } = renderHook(() => useClients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.clients).toEqual(mockClients);
    expect(result.current.error).toBeNull();
    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.hasPreviousPage).toBe(false);
  });

  it('handles fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const { result } = renderHook(() => useClients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.clients).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it('search updates results via searchClients API', async () => {
    // First call: initial list
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockClients, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }),
    });
    // Second call: search
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([mockClients[0]]),
    });

    const { result } = renderHook(() => useClients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.search('alice');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.clients).toHaveLength(1);
    expect(result.current.clients[0].name).toBe('Alice');
  });
});
