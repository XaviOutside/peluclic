/**
 * Frontend types for the Pet domain.
 * Mirrors the backend PetResponseDto shape returned by /api/v1/pets.
 *
 * TINYINT enums are mapped to string unions per the DTO layer.
 * - sex: DB TINYINT(0/1/2) → DTO 'unknown' | 'male' | 'female'
 * - status: DB TINYINT(0/1) → DTO 'active' | 'inactive'
 */

export type PetSex = 'unknown' | 'male' | 'female';
export type PetStatus = 'active' | 'inactive';

/**
 * Pet entity as returned by the API.
 * - dateOfBirth is an ISO 8601 string (or null)
 * - weightKg is the decimal value (or null)
 * - deletedAt is never exposed by the DTO
 */
export interface Pet {
  id: number;
  client_id: number;
  name: string;
  species: string;
  breed: string;
  sex: PetSex;
  dateOfBirth: string | null;
  weightKg: number | null;
  notes: string | null;
  status: PetStatus;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a new pet via POST /api/v1/pets. */
export interface CreatePetInput {
  client_id: number;
  name: string;
  species: string;
  breed: string;
  sex?: PetSex;
  dateOfBirth?: string;
  weightKg?: number;
  notes?: string;
}

/** Payload for updating an existing pet via PUT /api/v1/pets/:id. */
export interface UpdatePetInput {
  name?: string;
  species?: string;
  breed?: string;
  sex?: PetSex;
  dateOfBirth?: string | null;
  weightKg?: number | null;
  notes?: string | null;
}
