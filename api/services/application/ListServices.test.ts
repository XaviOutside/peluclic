import { describe, it, expect, vi } from 'vitest';
import { ListServicesUseCase } from './ListServices';
import { IServiceRepository } from '../domain/IServiceRepository';
import { Service, SERVICE_STATUS } from '../domain/Service';
import { ValidationError } from '@api/shared/domain/errors';

const makeService = (id: number, name: string): Service => ({
  id,
  name,
  description: null,
  durationMinutes: null,
  price: 1000,
  petId: null,
  status: SERVICE_STATUS.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

function makeRepository(services: Service[] = []): IServiceRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn().mockResolvedValue(services),
    update: vi.fn(),
    softDelete: vi.fn(),
    search: vi.fn(),
    unlinkAllByPetId: vi.fn(),
  };
}

describe('ListServicesUseCase', () => {
  it('returns all non-deleted services with default pagination', async () => {
    const services = [makeService(1, 'A'), makeService(2, 'B')];
    const repo = makeRepository(services);
    const uc = new ListServicesUseCase(repo);

    const result = await uc.execute({});

    expect(result).toEqual(services);
    expect(repo.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('uses provided page and limit', async () => {
    const repo = makeRepository([]);
    const uc = new ListServicesUseCase(repo);

    await uc.execute({ page: 2, limit: 10 });

    expect(repo.findAll).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });

  it('caps limit at 100', async () => {
    const repo = makeRepository([]);
    const uc = new ListServicesUseCase(repo);

    await uc.execute({ limit: 500 });

    expect(repo.findAll).toHaveBeenCalledWith({ page: 1, limit: 100 });
  });

  it('throws ValidationError when page is less than 1', async () => {
    const repo = makeRepository([]);
    const uc = new ListServicesUseCase(repo);

    await expect(uc.execute({ page: 0 })).rejects.toThrow(ValidationError);
    await expect(uc.execute({ page: 0 })).rejects.toThrow('Page must be at least 1');
  });

  it('throws ValidationError when limit is less than 1', async () => {
    const repo = makeRepository([]);
    const uc = new ListServicesUseCase(repo);

    await expect(uc.execute({ limit: 0 })).rejects.toThrow(ValidationError);
    await expect(uc.execute({ limit: 0 })).rejects.toThrow('Limit must be at least 1');
  });

  it('passes petId through to repository.findAll when provided', async () => {
    const services = [makeService(1, 'Pet Groom'), makeService(2, 'Pet Bath')];
    const repo = makeRepository(services);
    const uc = new ListServicesUseCase(repo);

    await uc.execute({ petId: 5 });

    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ petId: 5 }),
    );
  });

  it('does not pass petId when omitted', async () => {
    const services = [makeService(1, 'A')];
    const repo = makeRepository(services);
    const uc = new ListServicesUseCase(repo);

    await uc.execute({});

    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });
});
