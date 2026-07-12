import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateClientUseCase } from './UpdateClient';
import { SoftDeleteClientUseCase } from './SoftDeleteClient';
import { DeactivateClientUseCase } from './DeactivateClient';
import { IClientRepository } from '../domain/IClientRepository';
import { Client, CLIENT_STATUS } from '../domain/Client';
import { ClientNotFoundError, ClientAlreadyDeletedError } from '../domain/ClientErrors';
import { IPetRepository } from '../../pets/domain/IPetRepository';

const activeClient: Client = {
  id: 1,
  name: 'Alice Smith',
  email: 'alice@example.com',
  phone: '555-0300',
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

const updatedClient: Client = {
  ...activeClient,
  name: 'Alice Updated',
  updatedAt: new Date('2026-06-24T00:00:00Z'),
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

function makePetRepository(): IPetRepository {
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
    deactivateAllByClientId: vi.fn().mockResolvedValue(undefined),
    softDeleteAllByClientId: vi.fn().mockResolvedValue(undefined),
  };
}

// ─── UpdateClientUseCase ─────────────────────────────────────────────────────

describe('UpdateClientUseCase', () => {
  let repository: IClientRepository;
  let useCase: UpdateClientUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new UpdateClientUseCase(repository);
  });

  it('updates and returns the modified client', async () => {
    vi.mocked(repository.findById).mockResolvedValue(activeClient);
    vi.mocked(repository.update).mockResolvedValue(updatedClient);

    const result = await useCase.execute(1, { name: 'Alice Updated' });

    expect(result).toEqual(updatedClient);
    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(repository.update).toHaveBeenCalledWith(1, { name: 'Alice Updated' });
  });

  it('throws ClientNotFoundError when client does not exist', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(useCase.execute(99, { name: 'Ghost' })).rejects.toThrow(ClientNotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws ClientNotFoundError when client is soft-deleted', async () => {
    vi.mocked(repository.findById).mockResolvedValue(deletedClient);

    await expect(useCase.execute(2, { name: 'Ghost' })).rejects.toThrow(ClientNotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('does NOT pass status field through the update input', async () => {
    vi.mocked(repository.findById).mockResolvedValue(activeClient);
    vi.mocked(repository.update).mockResolvedValue(activeClient);

    // Even if caller somehow passes status, use case must strip it
    await useCase.execute(1, { name: 'Alice' });

    const updateCall = vi.mocked(repository.update).mock.calls[0][1];
    expect(updateCall).not.toHaveProperty('status');
  });
});

// ─── SoftDeleteClientUseCase ─────────────────────────────────────────────────

describe('SoftDeleteClientUseCase', () => {
  let repository: IClientRepository;
  let petRepository: IPetRepository;
  let useCase: SoftDeleteClientUseCase;

  beforeEach(() => {
    repository = makeRepository();
    petRepository = makePetRepository();
    useCase = new SoftDeleteClientUseCase(repository, petRepository);
  });

  it('calls repository.softDelete when client is active (existsById true, findById returns record)', async () => {
    vi.mocked(repository.existsById).mockResolvedValue(true);
    vi.mocked(repository.findById).mockResolvedValue(activeClient);
    vi.mocked(repository.softDelete).mockResolvedValue(undefined);

    await useCase.execute(1);

    expect(repository.existsById).toHaveBeenCalledWith(1);
    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(repository.softDelete).toHaveBeenCalledWith(1);
  });

  it('throws ClientNotFoundError when client does not exist (existsById returns false)', async () => {
    vi.mocked(repository.existsById).mockResolvedValue(false);

    await expect(useCase.execute(99)).rejects.toThrow(ClientNotFoundError);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('throws ClientAlreadyDeletedError when client is already soft-deleted (existsById true, findById null)', async () => {
    vi.mocked(repository.existsById).mockResolvedValue(true);
    vi.mocked(repository.findById).mockResolvedValue(null); // deletedAt filter hides it

    await expect(useCase.execute(2)).rejects.toThrow(ClientAlreadyDeletedError);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });
});

// ─── DeactivateClientUseCase ─────────────────────────────────────────────────

describe('DeactivateClientUseCase', () => {
  let repository: IClientRepository;
  let petRepository: IPetRepository;
  let useCase: DeactivateClientUseCase;

  beforeEach(() => {
    repository = makeRepository();
    petRepository = makePetRepository();
    useCase = new DeactivateClientUseCase(repository, petRepository);
  });

  it('sets status to INACTIVE (0) and calls repository.update', async () => {
    const inactiveClient: Client = { ...activeClient, status: CLIENT_STATUS.INACTIVE };
    vi.mocked(repository.findById).mockResolvedValue(activeClient);
    vi.mocked(repository.update).mockResolvedValue(inactiveClient);

    const result = await useCase.execute(1);

    expect(result.status).toBe(CLIENT_STATUS.INACTIVE);
    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(repository.update).toHaveBeenCalledWith(1, { status: CLIENT_STATUS.INACTIVE });
  });

  it('throws ClientNotFoundError when client does not exist', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(useCase.execute(99)).rejects.toThrow(ClientNotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws ClientNotFoundError when client is soft-deleted', async () => {
    vi.mocked(repository.findById).mockResolvedValue(deletedClient);

    await expect(useCase.execute(2)).rejects.toThrow(ClientNotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
