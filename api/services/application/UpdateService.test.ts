import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateServiceUseCase } from './UpdateService';
import { IServiceRepository } from '../domain/IServiceRepository';
import { Service, SERVICE_STATUS } from '../domain/Service';
import { NotFoundError, ValidationError } from '@api/shared/domain/errors';

const mockService: Service = {
  id: 1,
  name: 'Full Groom',
  description: 'Complete grooming',
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
    findById: vi.fn().mockResolvedValue(mockService),
    findAll: vi.fn(),
    update: vi.fn().mockResolvedValue({ ...mockService, name: 'Updated', price: 7500 }),
    softDelete: vi.fn(),
    search: vi.fn(),
    ...overrides,
  };
}

describe('UpdateServiceUseCase', () => {
  let repository: IServiceRepository;
  let useCase: UpdateServiceUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new UpdateServiceUseCase(repository);
  });

  it('updates and returns the service when valid', async () => {
    const result = await useCase.execute(1, { name: 'Updated', price: 7500 });

    expect(result.name).toBe('Updated');
    expect(result.price).toBe(7500);
    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(repository.update).toHaveBeenCalledWith(1, { name: 'Updated', price: 7500 });
  });

  it('throws NotFoundError when service does not exist', async () => {
    const repo = makeRepository({ findById: vi.fn().mockResolvedValue(null) });
    const uc = new UpdateServiceUseCase(repo);

    await expect(uc.execute(999, { name: 'X' })).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when service is soft-deleted', async () => {
    const deleted = { ...mockService, deletedAt: new Date() };
    const repo = makeRepository({ findById: vi.fn().mockResolvedValue(deleted) });
    const uc = new UpdateServiceUseCase(repo);

    await expect(uc.execute(1, { name: 'X' })).rejects.toThrow(NotFoundError);
  });

  it('validates name length when provided', async () => {
    await expect(
      useCase.execute(1, { name: 'A'.repeat(256) }),
    ).rejects.toThrow(ValidationError);

    await expect(
      useCase.execute(1, { name: 'A'.repeat(256) }),
    ).rejects.toThrow('Name must be 255 characters or fewer');
  });

  it('validates price when provided', async () => {
    await expect(
      useCase.execute(1, { price: -1 }),
    ).rejects.toThrow(ValidationError);

    await expect(
      useCase.execute(1, { price: -1 }),
    ).rejects.toThrow('Price must be a non-negative integer');
  });

  it('validates durationMinutes when provided', async () => {
    await expect(
      useCase.execute(1, { durationMinutes: -5 }),
    ).rejects.toThrow(ValidationError);

    await expect(
      useCase.execute(1, { durationMinutes: -5 }),
    ).rejects.toThrow('Duration must be a positive integer');
  });

  it('passes status field through to repository.update when provided', async () => {
    const updated = {
      ...mockService,
      name: 'Updated',
      status: SERVICE_STATUS.INACTIVE,
    };
    const repo = makeRepository({
      update: vi.fn().mockResolvedValue(updated),
    });
    const uc = new UpdateServiceUseCase(repo);

    const result = await uc.execute(1, { name: 'Updated', status: SERVICE_STATUS.INACTIVE });

    expect(result.status).toBe(SERVICE_STATUS.INACTIVE);
    expect(repo.update).toHaveBeenCalledWith(1, { name: 'Updated', status: SERVICE_STATUS.INACTIVE });
  });
});
