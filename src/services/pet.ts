import { http } from '@/services/http';
import type { Pet, CreatePetInput, UpdatePetInput } from '@/types/pet';

/**
 * Typed fetch wrappers for the /api/v1/pets endpoints.
 * All functions return typed responses and throw HttpError on failure.
 */

/** Fetch paginated list of pets, optionally filtered by client. */
export function listPets(
  page = 1,
  limit = 20,
  clientId?: number,
): Promise<Pet[]> {
  let url = `/pets?page=${page}&limit=${limit}`;
  if (clientId !== undefined) {
    url += `&client_id=${clientId}`;
  }
  return http<Pet[]>(url);
}

/** Fetch a single pet by ID. */
export function getPet(id: number): Promise<Pet> {
  return http<Pet>(`/pets/${id}`);
}

/** Create a new pet. Returns the created pet. */
export function createPet(data: CreatePetInput): Promise<Pet> {
  return http<Pet>('/pets', {
    method: 'POST',
    body: data,
  });
}

/** Update an existing pet. Backend uses PUT. */
export function updatePet(id: number, data: UpdatePetInput): Promise<Pet> {
  return http<Pet>(`/pets/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/** Soft-delete a pet by ID. */
export function deletePet(id: number): Promise<void> {
  return http<void>(`/pets/${id}`, {
    method: 'DELETE',
  });
}

/** Deactivate a pet (set status = inactive). */
export function deactivatePet(id: number): Promise<Pet> {
  return http<Pet>(`/pets/${id}/deactivate`, {
    method: 'PATCH',
  });
}

/** Search pets by query string across name, breed, and notes. */
export function searchPets(query: string): Promise<Pet[]> {
  const encoded = encodeURIComponent(query);
  return http<Pet[]>(`/pets/search?q=${encoded}`);
}
