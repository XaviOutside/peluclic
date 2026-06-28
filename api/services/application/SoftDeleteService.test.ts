import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoftDeleteServiceUseCase } from './SoftDeleteService';
import { IServiceRepository } from '../domain/IServiceRepository';
import { Service, SERVICE_STATUS } from '../domain/Service';
import { NotFoundError, AlreadyDeletedError } from '@api/shared/domain/errors';

const activeService: Service = {
  id: 1,
  name: 'Full Groom',
  description: null,
  durationMinutes: 60,
  price: 5000,
  status: SERVICE_STATUS.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

function makeRepository(overrides?: Partial<IServiceRepository>): IServiceRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(activeService),
    existsById: vi.fn().mockResolvedValue(true),
    findAll: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn().mockResolvedValue(undefined),
    search: vi.fn(),
    ...overrides,
  };
}

describe('SoftDeleteServiceUseCase', () => {
  let repository: IServiceRepository;
  let useCase: SoftDeleteServiceUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new SoftDeleteServiceUseCase(repository);
  });

  it('soft-deletes a non-deleted service', async () => {
    await useCase.execute(1);

    expect(repository.existsById).toHaveBeenCalledWith(1);
    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(repository.softDelete).toHaveBeenCalledWith(1);
  });

  it('throws NotFoundError when service does not exist (existsById returns false)', async () => {
    const repo = makeRepository({
      existsById: vi.fn().mockResolvedValue(false),
    });
    const uc = new SoftDeleteServiceUseCase(repo);

    await expect(uc.execute(999)).rejects.toThrow(NotFoundError);
    await expect(uc.execute(999)).rejects.toThrow('Service with id 999 not found');
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('throws AlreadyDeletedError when service is already deleted (existsById true, findById null)', async () => {
    const repo = makeRepository({
      existsById: vi.fn().mockResolvedValue(true),
      findById: vi.fn().mockResolvedValue(null), // deletedAt filter causes null
    });
    const uc = new SoftDeleteServiceUseCase(repo);

    await expect(uc.execute(1)).rejects.toThrow(AlreadyDeletedError);
    await expect(uc.execute(1)).rejects.toThrow('Service with id 1 is already deleted');
    expect(repo.softDelete).not.toHaveBeenCalled();
  });
});
