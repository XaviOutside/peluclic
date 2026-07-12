import { Client } from '../../domain/Client';

/**
 * Response DTO for client resources.
 * - status is human-readable ('active' | 'inactive'), not the raw TINYINT.
 * - createdAt / updatedAt are ISO 8601 strings.
 * - deletedAt is intentionally omitted (internal soft-delete field).
 */
export interface ClientResponseDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone2: string | null;
  address: string | null;
  status: 'active' | 'inactive';
  lastServiceDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Maps a domain Client entity to a ClientResponseDto.
 * Converts TINYINT status to human-readable string and Date to ISO string.
 */
export function toClientResponseDto(client: Client): ClientResponseDto {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    phone2: client.phone2,
    address: client.address,
    status: client.status === 1 ? 'active' : 'inactive',
    lastServiceDate: client.lastServiceDate
      ? client.lastServiceDate.toISOString().slice(0, 10)
      : null,
    notes: client.notes,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}
