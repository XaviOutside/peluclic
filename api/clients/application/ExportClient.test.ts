import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CLIENT_STATUS, type Client } from '../domain/Client';
import type { Pet } from '../../pets/domain/Pet';
import type { Appointment } from '../../appointments/domain/Appointment';
import type { Service } from '../../services/domain/Service';
import { ExportClientUseCase } from './ExportClient';
import type { IClientRepository } from '../domain/IClientRepository';
import type { IPetRepository } from '../../pets/domain/IPetRepository';
import type { IAppointmentRepository } from '../../appointments/domain/IAppointmentRepository';
import type { IServiceRepository } from '../../services/domain/IServiceRepository';

/** Stable fixtures for tests */

const clientFixture: Client = {
  id: 42,
  companyId: 1,
  name: 'Alice Smith',
  email: 'alice@example.com',
  phone: '555-0100',
  phone2: null,
  address: '123 Main St',
  status: CLIENT_STATUS.ACTIVE,
  lastServiceDate: new Date('2026-07-20'),
  notes: 'Loyal customer',
  consentGivenAt: new Date('2026-07-25T10:00:00.000Z'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  deletedAt: null,
};

const petFixture: Pet = {
  id: 1,
  client_id: 42,
  name: 'Max',
  species: 'Dog',
  breed: 'Golden Retriever',
  sex: 1 as const,
  dateOfBirth: new Date('2020-03-15'),
  weightKg: 32.5,
  notes: 'Friendly',
  status: 1 as const,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  deletedAt: null,
};

const appointmentFixture: Appointment = {
  id: 10,
  petId: 1,
  clientId: 42,
  scheduledAt: new Date('2026-07-20T14:00:00.000Z'),
  status: 2 as const, // completed
  notes: 'Full groom',
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
};

const serviceFixture: Service = {
  id: 5,
  name: 'Full Grooming',
  description: 'Complete grooming package',
  durationMinutes: 60,
  price: 5000,
  petId: 1,
  status: 1 as const,
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  updatedAt: new Date('2026-06-01T00:00:00.000Z'),
  deletedAt: null,
};

// Mock repositories
const mockClientRepo = {
  findById: vi.fn(),
} as unknown as IClientRepository;

const mockPetRepo = {
  findAllByClientId: vi.fn(),
} as unknown as IPetRepository;

const mockAppointmentRepo = {
  findByClientId: vi.fn(),
} as unknown as IAppointmentRepository;

const mockServiceRepo = {
  findByPetIds: vi.fn(),
} as unknown as IServiceRepository;

describe('ExportClientUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assembles full export with client, pets, appointments, and services', async () => {
    (mockClientRepo.findById as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(clientFixture),
    );
    (mockPetRepo.findAllByClientId as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({
        data: [petFixture],
        meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
      }),
    );
    (mockAppointmentRepo.findByClientId as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([appointmentFixture]),
    );
    (mockServiceRepo.findByPetIds as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([serviceFixture]),
    );

    const useCase = new ExportClientUseCase(
      mockClientRepo,
      mockPetRepo,
      mockAppointmentRepo,
      mockServiceRepo,
    );

    const result = await useCase.execute(42, 1);

    // Top-level shape
    expect(result.exportedAt).toBeDefined();
    expect(typeof result.exportedAt).toBe('string');
    expect(result.dataSubject).toBeDefined();

    // Client data
    expect(result.dataSubject.client.id).toBe(42);
    expect(result.dataSubject.client.name).toBe('Alice Smith');
    expect(result.dataSubject.client.email).toBe('alice@example.com');
    expect(result.dataSubject.client.status).toBe('active');
    expect(result.dataSubject.client.consentGivenAt).toBe('2026-07-25T10:00:00.000Z');

    // Pets
    expect(result.dataSubject.pets).toHaveLength(1);
    expect(result.dataSubject.pets[0].name).toBe('Max');
    expect(result.dataSubject.pets[0].species).toBe('Dog');

    // Appointments
    expect(result.dataSubject.appointments).toHaveLength(1);
    expect(result.dataSubject.appointments[0].petId).toBe(1);

    // Services
    expect(result.dataSubject.services).toHaveLength(1);
    expect(result.dataSubject.services[0].name).toBe('Full Grooming');

    // Verify cross-repo lookups were called
    expect(mockClientRepo.findById).toHaveBeenCalledWith(42);
    expect(mockPetRepo.findAllByClientId).toHaveBeenCalledWith(42, 1, 100);
    expect(mockAppointmentRepo.findByClientId).toHaveBeenCalledWith(42);
    expect(mockServiceRepo.findByPetIds).toHaveBeenCalledWith([1]);
  });

  it('throws ClientNotFoundError when client does not exist', async () => {
    (mockClientRepo.findById as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(null),
    );

    const useCase = new ExportClientUseCase(
      mockClientRepo,
      mockPetRepo,
      mockAppointmentRepo,
      mockServiceRepo,
    );

    await expect(useCase.execute(999, 1)).rejects.toThrow('Client with id 999 not found');
    expect(mockPetRepo.findAllByClientId).not.toHaveBeenCalled();
  });

  it('throws ClientNotFoundError when client belongs to different company (cross-company isolation)', async () => {
    (mockClientRepo.findById as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(clientFixture),
    );

    const useCase = new ExportClientUseCase(
      mockClientRepo,
      mockPetRepo,
      mockAppointmentRepo,
      mockServiceRepo,
    );

    await expect(useCase.execute(42, 999)).rejects.toThrow('Client with id 42 not found');
  });

  it('excludes soft-deleted records (empty result when all related records are deleted)', async () => {
    (mockClientRepo.findById as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(clientFixture),
    );
    (mockPetRepo.findAllByClientId as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({
        data: [],
        meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
      }),
    );
    (mockAppointmentRepo.findByClientId as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([]),
    );
    (mockServiceRepo.findByPetIds as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([]),
    );

    const useCase = new ExportClientUseCase(
      mockClientRepo,
      mockPetRepo,
      mockAppointmentRepo,
      mockServiceRepo,
    );

    const result = await useCase.execute(42, 1);

    expect(result.dataSubject.pets).toHaveLength(0);
    expect(result.dataSubject.appointments).toHaveLength(0);
    expect(result.dataSubject.services).toHaveLength(0);
    expect(result.dataSubject.client.id).toBe(42);
  });

  it('maps multiple pets with their associated data', async () => {
    const pet2: Pet = {
      ...petFixture,
      id: 2,
      name: 'Bella',
      species: 'Dog',
      breed: 'Labrador',
    };
    const appointment2: Appointment = {
      ...appointmentFixture,
      id: 11,
      petId: 2,
    };
    const service2: Service = {
      ...serviceFixture,
      id: 6,
      petId: 2,
      name: 'Nail Trim',
    };

    (mockClientRepo.findById as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(clientFixture),
    );
    (mockPetRepo.findAllByClientId as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({
        data: [petFixture, pet2],
        meta: { total: 2, page: 1, limit: 100, totalPages: 1 },
      }),
    );
    (mockAppointmentRepo.findByClientId as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([appointmentFixture, appointment2]),
    );
    (mockServiceRepo.findByPetIds as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([serviceFixture, service2]),
    );

    const useCase = new ExportClientUseCase(
      mockClientRepo,
      mockPetRepo,
      mockAppointmentRepo,
      mockServiceRepo,
    );

    const result = await useCase.execute(42, 1);

    expect(result.dataSubject.pets).toHaveLength(2);
    expect(result.dataSubject.appointments).toHaveLength(2);

    // Debug: verify findById was called
    expect(mockServiceRepo.findByPetIds).toHaveBeenCalledWith([1, 2]);
    expect(result.dataSubject.services).toHaveLength(2);

    // Pet IDs should be derived from the pet list
    expect(mockServiceRepo.findByPetIds).toHaveBeenCalledWith([1, 2]);
  });
});
