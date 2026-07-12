import { http } from '@/services/http';
import type { Service, CreateServiceInput, UpdateServiceInput } from '@/types/service';
import type { PaginatedResponse } from '@/types/pagination';

/**
 * Typed fetch wrappers for the /api/v1/services endpoints.
 * All functions return typed responses and throw HttpError on failure.
 */

/** Fetch paginated list of non-deleted services with metadata. */
export function listServices(
  page = 1,
  limit = 20,
  petId?: number,
): Promise<PaginatedResponse<Service>> {
  let url = `/services?page=${page}&limit=${limit}`;
  if (petId !== undefined) {
    url += `&petId=${petId}`;
  }
  return http<PaginatedResponse<Service>>(url);
}

/** Fetch a single service by ID. */
export function getService(id: number): Promise<Service> {
  return http<Service>(`/services/${id}`);
}

/** Create a new service. Returns the created service. */
export function createService(data: CreateServiceInput): Promise<Service> {
  return http<Service>('/services', {
    method: 'POST',
    body: data,
  });
}

/** Update an existing service. Backend uses PUT. */
export function updateService(id: number, data: UpdateServiceInput): Promise<Service> {
  return http<Service>(`/services/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/** Soft-delete a service by ID. */
export function deleteService(id: number): Promise<void> {
  return http<void>(`/services/${id}`, {
    method: 'DELETE',
  });
}

/** Deactivate a service (set status = inactive). */
export function deactivateService(id: number): Promise<Service> {
  return http<Service>(`/services/${id}/deactivate`, {
    method: 'PATCH',
  });
}

/** Search services by query string across name and description. */
export function searchServices(query: string): Promise<Service[]> {
  const encoded = encodeURIComponent(query);
  return http<Service[]>(`/services/search?q=${encoded}`);
}
