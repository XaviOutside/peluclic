import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchPetsUseCase } from './SearchPets';
import { IPetRepository } from '../domain/IPetRepository';
import { Pet, PET_SEX, PET_STATUS } from '../domain/Pet';

const matchingPet: Pet = {
  id: 3,
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

describe('SearchPetsUseCase', () => {
  let repository: IPetRepository;
  let useCase: SearchPetsUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new SearchPetsUseCase(repository);
  });

  it('returns results from repository.search()', async () => {
    vi.mocked(repository.search).mockResolvedValue([matchingPet]);

    const result = await useCase.execute({ query: 'shepherd' });

    expect(result).toEqual([matchingPet]);
    expect(repository.search).toHaveBeenCalledWith('shepherd');
  });

  it('calls sanitizeFtsQuery() before passing term to repository', async () => {
    vi.mocked(repository.search).mockResolvedValue([]);

    await useCase.execute({ query: '+shepherd -poodle' });

    // Operators stripped: "+shepherd -poodle" → "shepherd  poodle" → "shepherd poodle"
    const callArg = vi.mocked(repository.search).mock.calls[0][0];
    expect(callArg).not.toContain('+');
    expect(callArg).not.toContain('-');
    expect(callArg).toBe('shepherd poodle');
  });

  it('returns empty array and does NOT call repository when query is empty string', async () => {
    const result = await useCase.execute({ query: '' });

    expect(result).toEqual([]);
    expect(repository.search).not.toHaveBeenCalled();
  });

  it('returns empty array when query is only FTS operators (sanitizes to empty)', async () => {
    const result = await useCase.execute({ query: '+-*"()' });

    expect(result).toEqual([]);
    expect(repository.search).not.toHaveBeenCalled();
  });

  it('returns empty array when query is whitespace only', async () => {
    const result = await useCase.execute({ query: '   ' });

    expect(result).toEqual([]);
    expect(repository.search).not.toHaveBeenCalled();
  });
});
