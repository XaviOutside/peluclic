import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoftDeletePetUseCase } from './SoftDeletePet';
import { IPetRepository } from '../domain/IPetRepository';
import { IServiceRepository } from '../../services/domain/IServiceRepository';
import { Pet, PET_SEX, PET_STATUS } from '../domain/Pet';
import { PetNotFoundError, PetAlreadyDeletedError } from '../domain/PetErrors';

const activePet: Pet = {
  id: 7,
  client_id: 42,
  name: 'Bella',
  species: 'Dog',
  breed: 'Poodle',
  sex: PET_SEX.FEMALE,
  dateOfBirth: new Date('2022-05-10T00:00:00Z'),
  weightKg: 8.2,
  notes: null,
  status: PET_STATUS.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

function makeRepository(): IPetRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    existsById: vi.fn(),
    findAll: vi.fn(),
    findAllByClientId: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    search: vi.fn(),
    clientExistsAndIsActive: vi.fn(),
    deactivateAllByClientId: vi.fn(),
    softDeleteAllByClientId: vi.fn(),
  };
}

function makeServiceRepository(): IServiceRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    existsById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    search: vi.fn(),
    unlinkAllByPetId: vi.fn().mockResolvedValue(undefined),
  };
}

describe('SoftDeletePetUseCase', () => {
  let repository: IPetRepository;
  let serviceRepository: IServiceRepository;
  let useCase: SoftDeletePetUseCase;

  beforeEach(() => {
    repository = makeRepository();
    serviceRepository = makeServiceRepository();
    useCase = new SoftDeletePetUseCase(repository, serviceRepository);
  });

  it('calls repository.softDelete when pet is active (existsById true, findById returns record)', async () => {
    vi.mocked(repository.existsById).mockResolvedValue(true);
    vi.mocked(repository.findById).mockResolvedValue(activePet);
    vi.mocked(repository.softDelete).mockResolvedValue(undefined);

    await useCase.execute(7);

    expect(repository.existsById).toHaveBeenCalledWith(7);
    expect(repository.findById).toHaveBeenCalledWith(7);
    expect(serviceRepository.unlinkAllByPetId).toHaveBeenCalledWith(7);
    expect(repository.softDelete).toHaveBeenCalledWith(7);
  });

  it('calls unlinkAllByPetId before softDelete (cascade order)', async () => {
    const callOrder: string[] = [];
    vi.mocked(repository.existsById).mockResolvedValue(true);
    vi.mocked(repository.findById).mockResolvedValue(activePet);
    vi.mocked(serviceRepository.unlinkAllByPetId).mockImplementation(async () => {
      callOrder.push('unlink');
    });
    vi.mocked(repository.softDelete).mockImplementation(async () => {
      callOrder.push('softDelete');
    });

    await useCase.execute(7);

    expect(callOrder).toEqual(['unlink', 'softDelete']);
  });

  it('throws PetNotFoundError when pet does not exist (existsById returns false)', async () => {
    vi.mocked(repository.existsById).mockResolvedValue(false);

    await expect(useCase.execute(99)).rejects.toThrow(PetNotFoundError);
    expect(repository.softDelete).not.toHaveBeenCalled();
    expect(serviceRepository.unlinkAllByPetId).not.toHaveBeenCalled();
  });

  it('throws PetAlreadyDeletedError when pet is already soft-deleted (existsById true, findById null)', async () => {
    vi.mocked(repository.existsById).mockResolvedValue(true);
    vi.mocked(repository.findById).mockResolvedValue(null); // deletedAt filter hides it

    await expect(useCase.execute(8)).rejects.toThrow(PetAlreadyDeletedError);
    expect(repository.softDelete).not.toHaveBeenCalled();
    expect(serviceRepository.unlinkAllByPetId).not.toHaveBeenCalled();
  });
});
