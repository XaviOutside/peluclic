import { getStorage } from '@/storage/storageContext';
import type { Client, CreateClientDto, UpdateClientDto } from '@/types/client';
import type { PaginatedResponse } from '@/types/pagination';

/**
 * Typed wrappers that delegate to the active storage implementation.
 * All functions return typed responses and throw HttpError on failure
 * (only when the ApiStorage backend is active).
 */

/** Fetch paginated list of clients with metadata. */
export function listClients(page = 1, limit = 20): Promise<PaginatedResponse<Client>> {
  const storage = getStorage();
  return storage.listClients(page, limit);
}

/** Fetch a single client by ID. */
export function getClient(id: number): Promise<Client> {
  const storage = getStorage();
  return storage.getClient(id);
}

/** Create a new client. Returns the created client. */
export function createClient(data: CreateClientDto): Promise<Client> {
  const storage = getStorage();
  return storage.createClient(data);
}

/** Update an existing client. Backend uses PUT. */
export function updateClient(id: number, data: UpdateClientDto): Promise<Client> {
  const storage = getStorage();
  return storage.updateClient(id, data);
}

/** Soft-delete a client by ID. */
export function deleteClient(id: number): Promise<void> {
  const storage = getStorage();
  return storage.deleteClient(id);
}

/** Reactivate a client (set status = active). */
export function reactivateClient(id: number): Promise<Client> {
  const storage = getStorage();
  return storage.reactivateClient(id);
}

/** Deactivate a client (set status = inactive). */
export function deactivateClient(id: number): Promise<Client> {
  const storage = getStorage();
  return storage.deactivateClient(id);
}

/** Search clients by query string. */
export function searchClients(query: string): Promise<Client[]> {
  const storage = getStorage();
  return storage.searchClients(query);
}

/** Export all client data as structured JSON (Art. 20 GDPR data portability). */
export function exportClient(id: number): Promise<Record<string, unknown>> {
  const storage = getStorage();
  return storage.exportClient(id);
}
