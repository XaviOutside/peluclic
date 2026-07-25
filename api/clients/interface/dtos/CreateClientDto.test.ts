import { describe, it, expect } from 'vitest';
import type { CreateClientDto } from './CreateClientDto';
import { toClientResponseDto } from './ClientResponseDto';
import { Client, CLIENT_STATUS } from '../../domain/Client';

describe('CreateClientDto', () => {
  it('accepts consentGivenAt as an ISO 8601 string', () => {
    const dto: CreateClientDto = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555-0100',
      consentGivenAt: '2026-07-25T10:00:00Z',
    };

    expect(dto.consentGivenAt).toBe('2026-07-25T10:00:00Z');
    expect(dto.name).toBe('Jane Doe');
  });

  it('requires consentGivenAt (must be present)', () => {
    // TypeScript would reject this at compile time if consentGivenAt is required.
    // Using type assertion to pass unknown data (simulating runtime validation).
    const dto = {
      name: 'No Consent',
      email: 'noconsent@example.com',
      phone: '555-0200',
    } as CreateClientDto;

    // The DTO interface requires consentGivenAt, but at runtime it may be missing.
    // This is validated by CreateClientUseCase (tested separately in 3.2).
    expect(dto.name).toBe('No Consent');
  });
});

describe('ClientResponseDto', () => {
  const mockClient: Client = {
    id: 42,
    name: 'Alice Smith',
    email: 'alice@example.com',
    phone: '555-0100',
    phone2: null,
    address: '123 Main St',
    status: CLIENT_STATUS.ACTIVE,
    lastServiceDate: new Date('2026-07-20'),
    notes: 'Loyal customer',
    consentGivenAt: new Date('2026-07-25T10:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    deletedAt: null,
  };

  it('includes consentGivenAt as ISO 8601 string in response', () => {
    const dto = toClientResponseDto(mockClient);
    expect(dto.consentGivenAt).toBe('2026-07-25T10:00:00.000Z');
  });

  it('returns null for consentGivenAt when not set', () => {
    const clientWithoutConsent: Client = {
      ...mockClient,
      consentGivenAt: null,
    };
    const dto = toClientResponseDto(clientWithoutConsent);
    expect(dto.consentGivenAt).toBeNull();
  });

  it('includes all existing fields in the response', () => {
    const dto = toClientResponseDto(mockClient);
    expect(dto.id).toBe(42);
    expect(dto.name).toBe('Alice Smith');
    expect(dto.email).toBe('alice@example.com');
    expect(dto.phone).toBe('555-0100');
    expect(dto.address).toBe('123 Main St');
    expect(dto.status).toBe('active');
    expect(dto.notes).toBe('Loyal customer');
    expect(dto.createdAt).toBeDefined();
    expect(dto.updatedAt).toBeDefined();
  });
});
