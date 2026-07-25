import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateClientUseCase } from './CreateClient';
import { IClientRepository } from '../domain/IClientRepository';
import { Client, CLIENT_STATUS } from '../domain/Client';
import { ClientValidationError } from '../domain/ClientErrors';

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
  consentGivenAt: new Date('2026-07-25T10:00:00Z'),
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

function makeRepository(): IClientRepository {
  return {
    create: vi.fn().mockResolvedValue(mockClient),
    findById: vi.fn(),
    findByIdIncludeDeleted: vi.fn(),
    existsById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    hardDelete: vi.fn(),
    search: vi.fn(),
  };
}

describe('CreateClientUseCase', () => {
  let repository: IClientRepository;
  let useCase: CreateClientUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new CreateClientUseCase(repository);
  });

  it('creates and returns a client with default active status', async () => {
    const consentDate = new Date('2026-07-25T10:00:00Z');
    const result = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0100',
      consentGivenAt: consentDate,
    });

    expect(result).toEqual(mockClient);
    expect(result.status).toBe(CLIENT_STATUS.ACTIVE);
    expect(result.consentGivenAt).toBeInstanceOf(Date);
    expect(repository.create).toHaveBeenCalledOnce();
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0100',
        consentGivenAt: consentDate,
      }),
    );
  });

  it('throws ClientValidationError when name is empty', async () => {
    await expect(
      useCase.execute({ name: '', email: 'john@example.com', phone: '555-0100', consentGivenAt: new Date() }),
    ).rejects.toThrow(ClientValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws ClientValidationError when name is whitespace only', async () => {
    await expect(
      useCase.execute({ name: '   ', email: 'john@example.com', phone: '555-0100', consentGivenAt: new Date() }),
    ).rejects.toThrow(ClientValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws ClientValidationError when email is empty', async () => {
    await expect(
      useCase.execute({ name: 'John Doe', email: '', phone: '555-0100', consentGivenAt: new Date() }),
    ).rejects.toThrow(ClientValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws ClientValidationError when email does not contain @', async () => {
    await expect(
      useCase.execute({ name: 'John Doe', email: 'notanemail', phone: '555-0100', consentGivenAt: new Date() }),
    ).rejects.toThrow(ClientValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws ClientValidationError when phone is empty', async () => {
    await expect(
      useCase.execute({ name: 'John Doe', email: 'john@example.com', phone: '', consentGivenAt: new Date() }),
    ).rejects.toThrow(ClientValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws ClientValidationError when phone is whitespace only', async () => {
    await expect(
      useCase.execute({ name: 'John Doe', email: 'john@example.com', phone: '   ', consentGivenAt: new Date() }),
    ).rejects.toThrow(ClientValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws ClientValidationError when consentGivenAt is null', async () => {
    await expect(
      useCase.execute({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0100',
        consentGivenAt: null as unknown as Date,
      }),
    ).rejects.toThrow(ClientValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws ClientValidationError when consentGivenAt is an invalid date', async () => {
    await expect(
      useCase.execute({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0100',
        consentGivenAt: new Date('invalid') as unknown as Date,
      }),
    ).rejects.toThrow(ClientValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('persists consentGivenAt when valid', async () => {
    const consentDate = new Date('2026-07-25T10:00:00Z');
    const result = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0100',
      consentGivenAt: consentDate,
    });

    expect(result).toEqual(mockClient);
    expect(result.consentGivenAt).toEqual(consentDate);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ consentGivenAt: consentDate }),
    );
  });
});
