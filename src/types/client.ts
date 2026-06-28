/**
 * Frontend types for the Client domain.
 * Mirrors the backend ClientResponseDto shape returned by /api/v1/clients.
 */

export type ClientStatus = 'active' | 'inactive';

/**
 * Client entity as returned by the API.
 * - status is 'active' | 'inactive' (not the raw TINYINT)
 * - createdAt / updatedAt are ISO 8601 strings
 */
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone2: string | null;
  address: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a new client. */
export interface CreateClientDto {
  name: string;
  email: string;
  phone: string;
  phone2?: string;
  address?: string;
}

/** Payload for updating an existing client. All fields optional. */
export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  phone2?: string | null;
  address?: string | null;
}

/* PaginatedResponse<T> and ApiError moved to @/shared/types. */
