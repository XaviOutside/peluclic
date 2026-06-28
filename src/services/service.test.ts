/**
 * Tests for the services API client.
 *
 * Uses vi.stubGlobal('fetch') to mock HTTP requests.
 * Verifies: URL, method, body, and response shapes for all 7 endpoints.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  listServices,
  getService,
  createService,
  updateService,
  deactivateService,
  deleteService,
  searchServices,
} from './service';
import type { Service, CreateServiceInput } from '@/types/service';

const mockService: Service = {
  id: 1,
  name: 'Full Groom',
  description: 'Complete grooming',
  durationMinutes: 60,
  price: 50.00,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }));
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listServices', () => {
  it('fetches paginated services with default params', async () => {
    mockFetch(200, [mockService]);

    const result = await listServices();

    expect(result).toEqual([mockService]);
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/services?page=1&limit=20',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('passes custom page and limit', async () => {
    mockFetch(200, []);

    await listServices(2, 10);

    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/services?page=2&limit=10',
      expect.anything(),
    );
  });

  it('appends petId to URL when provided', async () => {
    mockFetch(200, [mockService]);

    await listServices(1, 20, 5);

    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/services?page=1&limit=20&petId=5',
      expect.anything(),
    );
  });

  it('does not include petId in URL when omitted', async () => {
    mockFetch(200, []);

    await listServices(1, 20);

    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/services?page=1&limit=20',
      expect.anything(),
    );
  });
});

describe('getService', () => {
  it('fetches a single service by id', async () => {
    mockFetch(200, mockService);

    const result = await getService(1);

    expect(result).toEqual(mockService);
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/services/1',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });
});

describe('createService', () => {
  it('sends POST with body and returns created service', async () => {
    mockFetch(201, { ...mockService, id: 3 });

    const input: CreateServiceInput = {
      name: 'Nail Trim',
      price: 15.00,
      durationMinutes: 30,
    };
    const result = await createService(input);

    expect(result.id).toBe(3);
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/services',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(input),
      }),
    );
  });
});

describe('updateService', () => {
  it('sends PUT with body and returns updated service', async () => {
    mockFetch(200, { ...mockService, name: 'Deluxe' });

    const result = await updateService(1, { name: 'Deluxe', price: 75 });

    expect(result.name).toBe('Deluxe');
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/services/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Deluxe', price: 75 }),
      }),
    );
  });
});

describe('deactivateService', () => {
  it('sends PATCH and returns deactivated service', async () => {
    mockFetch(200, { ...mockService, status: 'inactive' });

    const result = await deactivateService(1);

    expect(result.status).toBe('inactive');
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/services/1/deactivate',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });
});

describe('deleteService', () => {
  it('sends DELETE and returns void on 204', async () => {
    mockFetch(204, undefined);

    const result = await deleteService(1);

    expect(result).toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/services/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('searchServices', () => {
  it('sends GET with encoded query and returns results', async () => {
    mockFetch(200, [mockService]);

    const result = await searchServices('groom');

    expect(result).toEqual([mockService]);
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/services/search?q=groom',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('encodes special characters in query', async () => {
    mockFetch(200, []);

    await searchServices('cut & style');

    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/services/search?q=cut%20%26%20style',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });
});
