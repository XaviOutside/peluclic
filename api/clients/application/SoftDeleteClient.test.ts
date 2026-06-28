import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoftDeleteClientUseCase } from './SoftDeleteClient';
import { IClientRepository } from '../domain/IClientRepository';
import { Client, CLIENT_STATUS } from '../domain/Client';
import { ClientNotFoundError, ClientAlreadyDeletedError } from '../domain/ClientErrors';
import { IPetRepository } from '../../pets/domain/IPetRepository';

const mockClient: Client = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0100',
  phone2: null,
  address: null,
  status: CLIENT_STATUS.ACTIVE,
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
    existsById: vi.fn().mockResolvedValue(true),
    findAll: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn().mockResolvedValue(undefined),
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
    deactivateAllByClientId: vi.fn(),
    softDeleteAllByClientId: vi.fn().mockResolvedValue(undefined),
  };
}

describe('SoftDeleteClientUseCase', () => {
  let clientRepository: IClientRepository;
  let petRepository: IPetRepository;
  let useCase: SoftDeleteClientUseCase;

  beforeEach(() => {
    clientRepository = makeClientRepository();
    petRepository = makePetRepository();
    useCase = new SoftDeleteClientUseCase(clientRepository, petRepository);
  });

  it('calls softDeleteAllByClientId after soft-deleting the client (existsById true, findById returns record)', async () => {
    await useCase.execute(1);

    expect(clientRepository.existsById).toHaveBeenCalledWith(1);
    expect(clientRepository.findById).toHaveBeenCalledWith(1);
    expect(clientRepository.softDelete).toHaveBeenCalledWith(1);
    expect(petRepository.softDeleteAllByClientId).toHaveBeenCalledWith(1);
    expect(petRepository.softDeleteAllByClientId).toHaveBeenCalledOnce();
  });

  it('throws ClientNotFoundError when client does not exist (existsById returns false)', async () => {
    vi.mocked(clientRepository.existsById).mockResolvedValue(false);

    await expect(useCase.execute(99)).rejects.toThrow(ClientNotFoundError);
    expect(clientRepository.softDelete).not.toHaveBeenCalled();
    expect(petRepository.softDeleteAllByClientId).not.toHaveBeenCalled();
  });

  it('throws ClientAlreadyDeletedError when client is already soft-deleted (existsById true, findById null)', async () => {
    vi.mocked(clientRepository.existsById).mockResolvedValue(true);
    vi.mocked(clientRepository.findById).mockResolvedValue(null); // deletedAt filter hides it

    await expect(useCase.execute(2)).rejects.toThrow(ClientAlreadyDeletedError);
    expect(clientRepository.softDelete).not.toHaveBeenCalled();
    expect(petRepository.softDeleteAllByClientId).not.toHaveBeenCalled();
  });
});
