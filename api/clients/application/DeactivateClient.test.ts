import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeactivateClientUseCase } from './DeactivateClient';
import { IClientRepository } from '../domain/IClientRepository';
import { Client, CLIENT_STATUS } from '../domain/Client';
import { ClientNotFoundError } from '../domain/ClientErrors';
import { IPetRepository } from '../../pets/domain/IPetRepository';

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

const mockDeletedClient: Client = {
  ...mockClient,
  id: 2,
  deletedAt: new Date('2026-06-01T00:00:00Z'),
};

function makeClientRepository(): IClientRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(mockClient),
    existsById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn().mockResolvedValue({ ...mockClient, status: CLIENT_STATUS.INACTIVE }),
    softDelete: vi.fn(),
    search: vi.fn(),
  };
}

function makePetRepository(): IPetRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findAllByClientId: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    search: vi.fn(),
    clientExistsAndIsActive: vi.fn(),
    deactivateAllByClientId: vi.fn().mockResolvedValue(undefined),
    softDeleteAllByClientId: vi.fn(),
  };
}

describe('DeactivateClientUseCase', () => {
  let clientRepository: IClientRepository;
  let petRepository: IPetRepository;
  let useCase: DeactivateClientUseCase;

  beforeEach(() => {
    clientRepository = makeClientRepository();
    petRepository = makePetRepository();
    useCase = new DeactivateClientUseCase(clientRepository, petRepository);
  });

  it('calls deactivateAllByClientId after deactivating the client', async () => {
    const result = await useCase.execute(1);

    expect(result.status).toBe(CLIENT_STATUS.INACTIVE);
    expect(clientRepository.update).toHaveBeenCalledWith(1, { status: CLIENT_STATUS.INACTIVE });
    expect(petRepository.deactivateAllByClientId).toHaveBeenCalledWith(1);
    expect(petRepository.deactivateAllByClientId).toHaveBeenCalledOnce();
  });

  it('throws ClientNotFoundError when client does not exist (null)', async () => {
    vi.mocked(clientRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(99)).rejects.toThrow(ClientNotFoundError);
    expect(petRepository.deactivateAllByClientId).not.toHaveBeenCalled();
  });

  it('throws ClientNotFoundError when client is soft-deleted', async () => {
    vi.mocked(clientRepository.findById).mockResolvedValue(mockDeletedClient);

    await expect(useCase.execute(2)).rejects.toThrow(ClientNotFoundError);
    expect(petRepository.deactivateAllByClientId).not.toHaveBeenCalled();
  });
});
