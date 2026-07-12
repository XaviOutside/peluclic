import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchClientsUseCase } from './SearchClients';
import { IClientRepository } from '../domain/IClientRepository';
import { Client, CLIENT_STATUS } from '../domain/Client';

const matchingClient: Client = {
  id: 1,
  name: 'Bob Builder',
  email: 'bob@example.com',
  phone: '555-0400',
  phone2: null,
  address: null,
  status: CLIENT_STATUS.ACTIVE,
  lastServiceDate: null,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

function makeRepository(): IClientRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    existsById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    search: vi.fn(),
  };
}

describe('SearchClientsUseCase', () => {
  let repository: IClientRepository;
  let useCase: SearchClientsUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new SearchClientsUseCase(repository);
  });

  it('returns paginated results from repository.search()', async () => {
    vi.mocked(repository.search).mockResolvedValue([matchingClient]);

    const result = await useCase.execute({ query: 'bob' });

    expect(result).toEqual([matchingClient]);
    expect(repository.search).toHaveBeenCalledWith('bob');
  });

  it('calls sanitizeFtsQuery() before passing term to repository', async () => {
    vi.mocked(repository.search).mockResolvedValue([]);

    await useCase.execute({ query: '+bob -builder' });

    // Operators stripped: "+bob -builder" → "bob  builder" → "bob builder"
    const callArg = vi.mocked(repository.search).mock.calls[0][0];
    expect(callArg).not.toContain('+');
    expect(callArg).not.toContain('-');
    expect(callArg).toBe('bob builder');
  });

  it('returns empty array and does NOT call repository when sanitized term is blank', async () => {
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
