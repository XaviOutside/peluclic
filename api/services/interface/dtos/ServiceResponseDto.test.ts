/**
 * Tests for ServiceResponseDto mapping.
 *
 * Verifies:
 * - cents → dollars conversion (price / 100)
 * - TINYINT status → string ('active' | 'inactive')
 * - Date → ISO string
 * - deletedAt omitted
 * - null durationMinutes preserved
 */
import { describe, it, expect } from 'vitest';
import { toServiceResponseDto } from './ServiceResponseDto';
import { Service, SERVICE_STATUS, type ServiceStatus } from '../../domain/Service';

const makeService = (overrides: Partial<Service> = {}): Service => ({
  id: 1,
  name: 'Full Groom',
  description: 'Complete grooming',
  durationMinutes: 60,
  price: 5000,
  status: SERVICE_STATUS.ACTIVE as ServiceStatus,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-06-01T12:00:00.000Z'),
  deletedAt: null,
  ...overrides,
});

describe('toServiceResponseDto', () => {
  it('maps all fields correctly for an active service', () => {
    const dto = toServiceResponseDto(makeService());

    expect(dto.id).toBe(1);
    expect(dto.name).toBe('Full Groom');
    expect(dto.description).toBe('Complete grooming');
    expect(dto.durationMinutes).toBe(60);
    expect(dto.price).toBe(50.0); // 5000 cents → 50.00 dollars
    expect(dto.status).toBe('active');
    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2026-06-01T12:00:00.000Z');
    // deletedAt should be omitted from the DTO
    expect('deletedAt' in dto).toBe(false);
  });

  it('converts price from cents to dollars', () => {
    expect(toServiceResponseDto(makeService({ price: 2500 })).price).toBe(25.0);
    expect(toServiceResponseDto(makeService({ price: 4999 })).price).toBe(49.99);
    expect(toServiceResponseDto(makeService({ price: 0 })).price).toBe(0);
    expect(toServiceResponseDto(makeService({ price: 100 })).price).toBe(1.0);
  });

  it('maps status = 0 to "inactive"', () => {
    const dto = toServiceResponseDto(makeService({ status: SERVICE_STATUS.INACTIVE }));
    expect(dto.status).toBe('inactive');
  });

  it('maps status = 1 to "active"', () => {
    const dto = toServiceResponseDto(makeService({ status: SERVICE_STATUS.ACTIVE }));
    expect(dto.status).toBe('active');
  });

  it('preserves null for optional fields', () => {
    const svc = makeService({ description: null, durationMinutes: null });
    const dto = toServiceResponseDto(svc);

    expect(dto.description).toBeNull();
    expect(dto.durationMinutes).toBeNull();
  });

  it('converts dates to ISO strings', () => {
    const svc = makeService({
      createdAt: new Date('2025-12-25T10:30:00.000Z'),
      updatedAt: new Date('2026-01-15T14:45:00.000Z'),
    });
    const dto = toServiceResponseDto(svc);

    expect(dto.createdAt).toBe('2025-12-25T10:30:00.000Z');
    expect(dto.updatedAt).toBe('2026-01-15T14:45:00.000Z');
  });
});
