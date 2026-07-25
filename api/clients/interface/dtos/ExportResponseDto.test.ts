import { describe, it, expect } from 'vitest';
import type { ExportResponseDto, ExportedClient, ExportedPet, ExportedAppointment, ExportedService } from './ExportResponseDto';

describe('ExportResponseDto', () => {
  const mockExportedClient: ExportedClient = {
    id: 42,
    name: 'Alice Smith',
    email: 'alice@example.com',
    phone: '555-0100',
    phone2: null,
    address: '123 Main St',
    status: 'active' as const,
    lastServiceDate: '2026-07-20',
    notes: 'Loyal customer',
    consentGivenAt: '2026-07-25T10:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  const mockExportedPet: ExportedPet = {
    id: 1,
    clientId: 42,
    name: 'Max',
    species: 'Dog',
    breed: 'Golden Retriever',
    sex: 'male' as const,
    dateOfBirth: '2020-03-15T00:00:00.000Z',
    weightKg: 32.5,
    notes: 'Friendly',
    status: 'active' as const,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  const mockExportedAppointment: ExportedAppointment = {
    id: 10,
    petId: 1,
    scheduledAt: '2026-07-20T14:00:00.000Z',
    status: 'completed' as const,
    notes: 'Full groom',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  };

  const mockExportedService: ExportedService = {
    id: 5,
    name: 'Full Grooming',
    description: 'Complete grooming package',
    durationMinutes: 60,
    price: 5000, // $50.00 in cents
    petId: 1,
    status: 'active' as const,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  };

  it('has the complete ExportResponseDto shape', () => {
    const dto: ExportResponseDto = {
      exportedAt: '2026-07-25T12:00:00.000Z',
      dataSubject: {
        client: mockExportedClient,
        pets: [mockExportedPet],
        appointments: [mockExportedAppointment],
        services: [mockExportedService],
      },
    };

    // Verify top-level structure
    expect(dto.exportedAt).toBe('2026-07-25T12:00:00.000Z');
    expect(dto.dataSubject).toBeDefined();

    // Verify client data
    expect(dto.dataSubject.client.id).toBe(42);
    expect(dto.dataSubject.client.name).toBe('Alice Smith');
    expect(dto.dataSubject.client.email).toBe('alice@example.com');
    expect(dto.dataSubject.client.status).toBe('active');
    expect(dto.dataSubject.client.consentGivenAt).toBe('2026-07-25T10:00:00.000Z');

    // Verify pets array
    expect(dto.dataSubject.pets).toHaveLength(1);
    expect(dto.dataSubject.pets[0].name).toBe('Max');
    expect(dto.dataSubject.pets[0].species).toBe('Dog');

    // Verify appointments array
    expect(dto.dataSubject.appointments).toHaveLength(1);
    expect(dto.dataSubject.appointments[0].petId).toBe(1);
    expect(dto.dataSubject.appointments[0].status).toBe('completed');

    // Verify services array
    expect(dto.dataSubject.services).toHaveLength(1);
    expect(dto.dataSubject.services[0].name).toBe('Full Grooming');
    expect(dto.dataSubject.services[0].price).toBe(5000);
  });

  it('supports empty collections', () => {
    const dto: ExportResponseDto = {
      exportedAt: '2026-07-25T12:00:00.000Z',
      dataSubject: {
        client: mockExportedClient,
        pets: [],
        appointments: [],
        services: [],
      },
    };

    expect(dto.dataSubject.pets).toHaveLength(0);
    expect(dto.dataSubject.appointments).toHaveLength(0);
    expect(dto.dataSubject.services).toHaveLength(0);
    expect(dto.dataSubject.client.id).toBe(42);
  });

  it('supports null/optional fields as null', () => {
    const clientWithNulls: ExportedClient = {
      ...mockExportedClient,
      phone2: null,
      address: null,
      lastServiceDate: null,
      notes: null,
      consentGivenAt: null,
    };

    const dto: ExportResponseDto = {
      exportedAt: '2026-07-25T12:00:00.000Z',
      dataSubject: {
        client: clientWithNulls,
        pets: [],
        appointments: [],
        services: [],
      },
    };

    expect(dto.dataSubject.client.phone2).toBeNull();
    expect(dto.dataSubject.client.consentGivenAt).toBeNull();
    expect(dto.dataSubject.client.notes).toBeNull();
    expect(dto.dataSubject.client.id).toBe(42);
  });
});
