import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePetUseCase } from './CreatePet';
import { IPetRepository } from '../domain/IPetRepository';
import { Pet, CreatePetInput, PET_SEX, PET_STATUS } from '../domain/Pet';
import { PetValidationError } from '../domain/PetErrors';

const mockPet: Pet = {
  id: 1,
  client_id: 42,
  name: 'Rex',
  species: 'Dog',
  breed: 'German Shepherd',
  sex: PET_SEX.MALE,
  dateOfBirth: new Date('2023-01-15T00:00:00Z'),
  weightKg: 32.5,
  notes: 'Friendly dog',
  status: PET_STATUS.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

function makeRepository(): IPetRepository {
  return {
    create: vi.fn().mockResolvedValue(mockPet),
    findById: vi.fn(),
    findAll: vi.fn(),
    findAllByClientId: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    search: vi.fn(),
    clientExistsAndIsActive: vi.fn().mockResolvedValue(true),
    deactivateAllByClientId: vi.fn(),
    softDeleteAllByClientId: vi.fn(),
  };
}

describe('CreatePetUseCase', () => {
  let repository: IPetRepository;
  let useCase: CreatePetUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new CreatePetUseCase(repository);
  });

  it('creates and returns a pet when all validations pass', async () => {
    const input: CreatePetInput = {
      client_id: 42,
      name: 'Rex',
      species: 'Dog',
      breed: 'German Shepherd',
    };

    const result = await useCase.execute(input);

    expect(result).toEqual(mockPet);
    expect(result.status).toBe(PET_STATUS.ACTIVE);
    expect(repository.clientExistsAndIsActive).toHaveBeenCalledWith(42);
    expect(repository.create).toHaveBeenCalledOnce();
    expect(repository.create).toHaveBeenCalledWith(input);
  });

  it('throws PetValidationError when name is empty', async () => {
    await expect(
      useCase.execute({ client_id: 42, name: '', species: 'Dog', breed: 'Shepherd' }),
    ).rejects.toThrow(PetValidationError);

    await expect(
      useCase.execute({ client_id: 42, name: '', species: 'Dog', breed: 'Shepherd' }),
    ).rejects.toThrow('Name is required');

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws PetValidationError when name is whitespace only', async () => {
    await expect(
      useCase.execute({ client_id: 42, name: '   ', species: 'Dog', breed: 'Shepherd' }),
    ).rejects.toThrow(PetValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws PetValidationError when name exceeds 100 characters', async () => {
    const longName = 'A'.repeat(101);

    await expect(
      useCase.execute({ client_id: 42, name: longName, species: 'Dog', breed: 'Shepherd' }),
    ).rejects.toThrow(PetValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws PetValidationError when species is empty', async () => {
    await expect(
      useCase.execute({ client_id: 42, name: 'Rex', species: '', breed: 'Shepherd' }),
    ).rejects.toThrow(PetValidationError);

    await expect(
      useCase.execute({ client_id: 42, name: 'Rex', species: '', breed: 'Shepherd' }),
    ).rejects.toThrow('Species is required');

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws PetValidationError when species is whitespace only', async () => {
    await expect(
      useCase.execute({ client_id: 42, name: 'Rex', species: '   ', breed: 'Shepherd' }),
    ).rejects.toThrow(PetValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws PetValidationError when species exceeds 100 characters', async () => {
    const longSpecies = 'B'.repeat(101);

    await expect(
      useCase.execute({ client_id: 42, name: 'Rex', species: longSpecies, breed: 'Shepherd' }),
    ).rejects.toThrow(PetValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws PetValidationError when client_id references an inactive, deleted, or nonexistent client', async () => {
    vi.mocked(repository.clientExistsAndIsActive).mockResolvedValue(false);

    await expect(
      useCase.execute({ client_id: 99, name: 'Rex', species: 'Dog', breed: 'Shepherd' }),
    ).rejects.toThrow(PetValidationError);

    await expect(
      useCase.execute({ client_id: 99, name: 'Rex', species: 'Dog', breed: 'Shepherd' }),
    ).rejects.toThrow('client_id is not an active client');

    expect(repository.clientExistsAndIsActive).toHaveBeenCalledWith(99);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('allows name and species at exactly 100 characters', async () => {
    const name = 'A'.repeat(100);
    const species = 'B'.repeat(100);

    await useCase.execute({ client_id: 42, name, species, breed: 'Shepherd' });

    expect(repository.create).toHaveBeenCalledOnce();
  });
});
