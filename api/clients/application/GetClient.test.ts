import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetClientUseCase } from './GetClient';
import { ListClientsUseCase } from './ListClients';
import { IClientRepository } from '../domain/IClientRepository';
import { Client, CLIENT_STATUS } from '../domain/Client';
import { ClientNotFoundError, ClientValidationError } from '../domain/ClientErrors';

const activeClient: Client = {
  id: 1,
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555-0200',
  phone2: null,
  address: null,
  status: CLIENT_STATUS.ACTIVE,
  lastServiceDate: null,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

const deletedClient: Client = {
  ...activeClient,
  id: 2,
  deletedAt: new Date('2026-06-01T00:00:00Z'),
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

// ─── GetClientUseCase ────────────────────────────────────────────────────────

describe('GetClientUseCase', () => {
  let repository: IClientRepository;
  let useCase: GetClientUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new GetClientUseCase(repository);
  });

  it('returns the client when found and not deleted', async () => {
    vi.mocked(repository.findById).mockResolvedValue(activeClient);

    const result = await useCase.execute(1);

    expect(result).toEqual(activeClient);
    expect(repository.findById).toHaveBeenCalledWith(1);
  });

  it('throws ClientNotFoundError when client does not exist (null)', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(useCase.execute(99)).rejects.toThrow(ClientNotFoundError);
    await expect(useCase.execute(99)).rejects.toThrow('99');
  });

  it('throws ClientNotFoundError when client is soft-deleted', async () => {
    vi.mocked(repository.findById).mockResolvedValue(deletedClient);

    await expect(useCase.execute(2)).rejects.toThrow(ClientNotFoundError);
  });
});

// ─── ListClientsUseCase ──────────────────────────────────────────────────────

describe('ListClientsUseCase', () => {
  let repository: IClientRepository;
  let useCase: ListClientsUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new ListClientsUseCase(repository);
  });

  it('returns paginated results from the repository', async () => {
    vi.mocked(repository.findAll).mockResolvedValue([activeClient]);

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result).toEqual([activeClient]);
    expect(repository.findAll).toHaveBeenCalledWith(1, 10);
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

  it('throws ClientValidationError when page is less than 1', async () => {
    await expect(useCase.execute({ page: 0, limit: 20 })).rejects.toThrow(ClientValidationError);
    expect(repository.findAll).not.toHaveBeenCalled();
  });

  it('throws ClientValidationError when limit is less than 1', async () => {
    await expect(useCase.execute({ page: 1, limit: 0 })).rejects.toThrow(ClientValidationError);
    expect(repository.findAll).not.toHaveBeenCalled();
  });
});
