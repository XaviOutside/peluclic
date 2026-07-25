import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HardDeleteClientUseCase } from './HardDeleteClient';
import { IClientRepository } from '../domain/IClientRepository';
import { Client, CLIENT_STATUS } from '../domain/Client';
import { ClientNotFoundError } from '../domain/ClientErrors';
import { IPetRepository } from '../../pets/domain/IPetRepository';
import { Pet, PET_STATUS, PetSex } from '../../pets/domain/Pet';
import { IAppointmentRepository } from '../../appointments/domain/IAppointmentRepository';
import { IServiceRepository } from '../../services/domain/IServiceRepository';
import { prisma } from '../../shared/infrastructure/prisma';

// Mock prisma.$transaction to execute the callback with a dummy tx
vi.mock('../../shared/infrastructure/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn: (...args: unknown[]) => unknown) => fn({})),
  },
}));

const mockClient: Client = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0100',
  phone2: null,
  address: null,
  status: CLIENT_STATUS.ACTIVE,
  lastServiceDate: null,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

const mockPets: Pet[] = [
  {
    id: 10,
    client_id: 1,
    name: 'Rex',
    species: 'Dog',
    breed: 'German Shepherd',
    sex: 1 as PetSex,
    dateOfBirth: null,
    weightKg: null,
    notes: null,
    status: PET_STATUS.ACTIVE,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
  },
  {
    id: 11,
    client_id: 1,
    name: 'Mimi',
    species: 'Cat',
    breed: 'Siamese',
    sex: 2 as PetSex,
    dateOfBirth: null,
    weightKg: null,
    notes: null,
    status: PET_STATUS.ACTIVE,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: new Date('2026-01-01'),
  },
];

describe('HardDeleteClientUseCase', () => {
  let clientRepository: IClientRepository;
  let petRepository: IPetRepository;
  let appointmentRepository: IAppointmentRepository;
  let serviceRepository: IServiceRepository;
  let useCase: HardDeleteClientUseCase;

  beforeEach(() => {
    clientRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByIdIncludeDeleted: vi.fn().mockResolvedValue(mockClient),
      existsById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      hardDelete: vi.fn().mockResolvedValue(undefined),
      search: vi.fn(),
    };

    petRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      existsById: vi.fn(),
      findAll: vi.fn(),
      findAllByClientId: vi.fn(),
      findByClientIdIncludeDeleted: vi.fn().mockResolvedValue(mockPets),
      update: vi.fn(),
      softDelete: vi.fn(),
      hardDelete: vi.fn().mockResolvedValue(undefined),
      search: vi.fn(),
      clientExistsAndIsActive: vi.fn(),
      deactivateAllByClientId: vi.fn(),
      softDeleteAllByClientId: vi.fn(),
    };

    appointmentRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByDateRange: vi.fn(),
      findByDateRangeWithDetails: vi.fn(),
      existsByPetAndTime: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      hardDelete: vi.fn(),
      hardDeleteByPetId: vi.fn().mockResolvedValue(undefined),
      hardDeleteByClientId: vi.fn(),
      findByClientId: vi.fn(),
    };

    serviceRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      existsById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      hardDeleteByPetId: vi.fn().mockResolvedValue(undefined),
      search: vi.fn(),
      unlinkAllByPetId: vi.fn(),
    };

    useCase = new HardDeleteClientUseCase(
      clientRepository,
      petRepository,
      appointmentRepository,
      serviceRepository,
    );
  });

  it('cascades hard-delete: client → pets → appointments → services', async () => {
    await useCase.execute(1);

    // Verify prisma.$transaction was used
    expect(prisma.$transaction).toHaveBeenCalled();

    // Client hard-deleted
    expect(clientRepository.findByIdIncludeDeleted).toHaveBeenCalledWith(1);
    expect(clientRepository.hardDelete).toHaveBeenCalledWith(1, expect.any(Object));

    // For each pet: appointments + services hard-deleted, pet hard-deleted
    expect(appointmentRepository.hardDeleteByPetId).toHaveBeenCalledTimes(2);
    expect(appointmentRepository.hardDeleteByPetId).toHaveBeenNthCalledWith(
      1,
      10,
      [2],
      expect.any(Object),
    );
    expect(appointmentRepository.hardDeleteByPetId).toHaveBeenNthCalledWith(
      2,
      11,
      [2],
      expect.any(Object),
    );

    expect(serviceRepository.hardDeleteByPetId).toHaveBeenCalledTimes(2);
    expect(serviceRepository.hardDeleteByPetId).toHaveBeenNthCalledWith(1, 10, expect.any(Object));
    expect(serviceRepository.hardDeleteByPetId).toHaveBeenNthCalledWith(2, 11, expect.any(Object));

    expect(petRepository.hardDelete).toHaveBeenCalledTimes(2);
    expect(petRepository.hardDelete).toHaveBeenNthCalledWith(1, 10, expect.any(Object));
    expect(petRepository.hardDelete).toHaveBeenNthCalledWith(2, 11, expect.any(Object));
  });

  it('throws ClientNotFoundError when client does not exist', async () => {
    vi.mocked(clientRepository.findByIdIncludeDeleted).mockResolvedValue(null);

    await expect(useCase.execute(99)).rejects.toThrow(ClientNotFoundError);
    expect(clientRepository.hardDelete).not.toHaveBeenCalled();
    expect(petRepository.hardDelete).not.toHaveBeenCalled();
  });

  it('handles clients with no pets gracefully', async () => {
    vi.mocked(petRepository.findByClientIdIncludeDeleted).mockResolvedValue([]);

    await useCase.execute(1);

    expect(petRepository.hardDelete).not.toHaveBeenCalled();
    // But clientRepo.hardDelete should still be called
    expect(clientRepository.hardDelete).toHaveBeenCalledWith(1, expect.any(Object));
  });
});
