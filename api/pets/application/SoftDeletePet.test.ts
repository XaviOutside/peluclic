import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoftDeletePetUseCase } from './SoftDeletePet';
import { IPetRepository } from '../domain/IPetRepository';
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

const deletedPet: Pet = {
  ...activePet,
  id: 8,
  deletedAt: new Date('2026-06-01T00:00:00Z'),
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

describe('SoftDeletePetUseCase', () => {
  let repository: IPetRepository;
  let useCase: SoftDeletePetUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new SoftDeletePetUseCase(repository);
  });

  it('calls repository.softDelete when pet is active (existsById true, findById returns record)', async () => {
    vi.mocked(repository.existsById).mockResolvedValue(true);
    vi.mocked(repository.findById).mockResolvedValue(activePet);
    vi.mocked(repository.softDelete).mockResolvedValue(undefined);

    await useCase.execute(7);

    expect(repository.existsById).toHaveBeenCalledWith(7);
    expect(repository.findById).toHaveBeenCalledWith(7);
    expect(repository.softDelete).toHaveBeenCalledWith(7);
  });

  it('throws PetNotFoundError when pet does not exist (existsById returns false)', async () => {
    vi.mocked(repository.existsById).mockResolvedValue(false);

    await expect(useCase.execute(99)).rejects.toThrow(PetNotFoundError);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('throws PetAlreadyDeletedError when pet is already soft-deleted (existsById true, findById null)', async () => {
    vi.mocked(repository.existsById).mockResolvedValue(true);
    vi.mocked(repository.findById).mockResolvedValue(null); // deletedAt filter hides it

    await expect(useCase.execute(8)).rejects.toThrow(PetAlreadyDeletedError);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });
});
