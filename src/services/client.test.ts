import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  reactivateClient,
  deactivateClient,
  searchClients,
} from './client';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('listClients', () => {
  it('returns paginated response with data and meta on success', async () => {
    const response = {
      data: [
        { id: 1, name: 'Alice', email: 'alice@example.com', phone: '555-0101', phone2: null, address: null, status: 'active', notes: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
    });

    const result = await listClients();
    expect(result).toEqual(response);
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/clients?page=1&limit=20',
      expect.anything(),
    );
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(listClients()).rejects.toThrow('Network error');
  });
});

describe('getClient', () => {
  it('fetches a single client by id', async () => {
    const client = { id: 42, name: 'Bob', email: 'bob@example.com', phone: '555-0102', phone2: null, address: null, status: 'active', notes: null, createdAt: '', updatedAt: '' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(client),
    });

    const result = await getClient(42);
    expect(result).toEqual(client);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/clients/42',
      expect.anything(),
    );
  });

  it('throws 404 error when client not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Client not found' }),
    });

    await expect(getClient(999)).rejects.toThrow('Client not found');
  });
});

describe('createClient', () => {
  it('posts data and returns created client', async () => {
    const dto = { name: 'New', email: 'new@example.com', phone: '555-0103' };
    const created = { id: 1, ...dto, phone2: null, address: null, status: 'active', notes: null, createdAt: '', updatedAt: '' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(created),
    });

    const result = await createClient(dto);
    expect(result).toEqual(created);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/clients',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('updateClient', () => {
  it('puts data and returns updated client', async () => {
    const dto = { name: 'Updated' };
    const updated = { id: 1, name: 'Updated', email: 'a@b.com', phone: '555-0100', phone2: null, address: null, status: 'active', notes: null, createdAt: '', updatedAt: '' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(updated),
    });

    const result = await updateClient(1, dto);
    expect(result).toEqual(updated);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/clients/1',
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});

describe('deleteClient', () => {
  it('sends delete and returns void on 204', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => { throw new Error('No body'); },
    });

    const result = await deleteClient(1);
    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/clients/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('reactivateClient', () => {
  it('patches reactivate endpoint', async () => {
    const client = { id: 1, name: 'A', email: 'a@b.com', phone: '555', phone2: null, address: null, status: 'active', notes: null, createdAt: '', updatedAt: '' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(client),
    });

    const result = await reactivateClient(1);
    expect(result).toEqual(client);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/clients/1/reactivate',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });
});

describe('deactivateClient', () => {
  it('patches deactivate endpoint', async () => {
    const client = { id: 1, name: 'A', email: 'a@b.com', phone: '555', phone2: null, address: null, status: 'inactive', notes: null, createdAt: '', updatedAt: '' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(client),
    });

    const result = await deactivateClient(1);
    expect(result).toEqual(client);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/clients/1/deactivate',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });
});

describe('searchClients', () => {
  it('calls search endpoint with encoded query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await searchClients('john doe');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/clients/search?q=john%20doe',
      expect.anything(),
    );
  });
});
