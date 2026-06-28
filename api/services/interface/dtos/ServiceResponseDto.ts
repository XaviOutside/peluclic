import { Service, SERVICE_STATUS } from '../../domain/Service';

/**
 * Response DTO for service resources.
 * - status is human-readable ('active' | 'inactive'), not the raw TINYINT.
 * - price is in dollar format (e.g. 50.00), not integer cents.
 * - createdAt / updatedAt are ISO 8601 strings.
 * - deletedAt is intentionally omitted (internal soft-delete field).
 * - petId is the linked pet or null if unlinked.
 */
export interface ServiceResponseDto {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  price: number;
  petId: number | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

/**
 * Maps a domain Service entity to a ServiceResponseDto.
 * Converts TINYINT status to human-readable strings, cents to dollars,
 * and Date to ISO strings. Omits deletedAt.
 */
export function toServiceResponseDto(service: Service): ServiceResponseDto {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    price: service.price / 100,
    petId: service.petId,
    status: service.status === SERVICE_STATUS.ACTIVE ? 'active' : 'inactive',
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}
