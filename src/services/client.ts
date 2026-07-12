import { http } from '@/services/http';
import type { Client, CreateClientDto, UpdateClientDto } from '@/types/client';
import type { PaginatedResponse } from '@/types/pagination';

/**
 * Typed fetch wrappers for the /api/v1/clients endpoints.
 * All functions return typed responses and throw HttpError on failure.
 */

/** Fetch paginated list of clients with metadata. */
export function listClients(page = 1, limit = 20): Promise<PaginatedResponse<Client>> {
  return http<PaginatedResponse<Client>>(`/clients?page=${page}&limit=${limit}`);
}

/** Fetch a single client by ID. */
export function getClient(id: number): Promise<Client> {
  return http<Client>(`/clients/${id}`);
}

/** Create a new client. Returns the created client. */
export function createClient(data: CreateClientDto): Promise<Client> {
  return http<Client>('/clients', {
    method: 'POST',
    body: data,
  });
}

/** Update an existing client. Backend uses PUT. */
export function updateClient(id: number, data: UpdateClientDto): Promise<Client> {
  return http<Client>(`/clients/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/** Soft-delete a client by ID. */
export function deleteClient(id: number): Promise<void> {
  return http<void>(`/clients/${id}`, {
    method: 'DELETE',
  });
}

/** Reactivate a client (set status = active). */
export function reactivateClient(id: number): Promise<Client> {
  return http<Client>(`/clients/${id}/reactivate`, {
    method: 'PATCH',
  });
}

/** Deactivate a client (set status = inactive). */
export function deactivateClient(id: number): Promise<Client> {
  return http<Client>(`/clients/${id}/deactivate`, {
    method: 'PATCH',
  });
}

/** Search clients by query string. */
export function searchClients(query: string): Promise<Client[]> {
  const encoded = encodeURIComponent(query);
  return http<Client[]>(`/clients/search?q=${encoded}`);
}
