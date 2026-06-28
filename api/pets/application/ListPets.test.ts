import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListPetsUseCase } from './ListPets';
import { IPetRepository } from '../domain/IPetRepository';
import { Pet, PET_SEX, PET_STATUS } from '../domain/Pet';
import { PetValidationError } from '../domain/PetErrors';

const pet1: Pet = {
  id: 1,
  client_id: 42,
  name: 'Rex',
  species: 'Dog',
  breed: 'German Shepherd',
  sex: PET_SEX.MALE,
  dateOfBirth: new Date('2023-01-15T00:00:00Z'),
  weightKg: 32.5,
  notes: null,
  status: PET_STATUS.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

const pet2: Pet = {
  ...pet1,
  id: 2,
  name: 'Bella',
  breed: 'Poodle',
  sex: PET_SEX.FEMALE,
  weightKg: 8.2,
};

function makeRepository(): IPetRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
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

describe('ListPetsUseCase', () => {
  let repository: IPetRepository;
  let useCase: ListPetsUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new ListPetsUseCase(repository);
  });

  it('returns paginated results from findAll when no clientId filter', async () => {
    vi.mocked(repository.findAll).mockResolvedValue([pet1, pet2]);

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result).toEqual([pet1, pet2]);
    expect(repository.findAll).toHaveBeenCalledWith(1, 10);
    expect(repository.findAllByClientId).not.toHaveBeenCalled();
  });

  it('returns paginated results from findAllByClientId when clientId is provided', async () => {
    vi.mocked(repository.findAllByClientId).mockResolvedValue([pet1]);

    const result = await useCase.execute({ page: 1, limit: 10, clientId: 42 });

    expect(result).toEqual([pet1]);
    expect(repository.findAllByClientId).toHaveBeenCalledWith(42, 1, 10);
    expect(repository.findAll).not.toHaveBeenCalled();
  });

  it('uses default page=1 and limit=20 when not provided', async () => {
    vi.mocked(repository.findAll).mockResolvedValue([]);

    await useCase.execute({});

    expect(repository.findAll).toHaveBeenCalledWith(1, 20);
  });

  it('clamps limit to maximum of 100', async () => {
    vi.mocked(repository.findAll).mockResolvedValue([]);

    await useCase.execute({ page: 1, limit: 200 });

    expect(repository.findAll).toHaveBeenCalledWith(1, 100);
  });

  it('throws PetValidationError when page is less than 1', async () => {
    await expect(useCase.execute({ page: 0, limit: 20 })).rejects.toThrow(PetValidationError);
    expect(repository.findAll).not.toHaveBeenCalled();
  });

  it('throws PetValidationError when limit is less than 1', async () => {
    await expect(useCase.execute({ page: 1, limit: 0 })).rejects.toThrow(PetValidationError);
    expect(repository.findAll).not.toHaveBeenCalled();
  });
});
