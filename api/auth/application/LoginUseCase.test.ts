import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase } from './LoginUseCase';
import { IAuthRepository } from '../domain/IAuthRepository';
import { IPasswordService } from '../domain/IPasswordService';
import { User, USER_ROLE, USER_STATUS } from '../domain/User';
import { Session } from '../domain/Session';
import { InvalidCredentialsError } from '../domain/AuthErrors';

const mockUser: User = {
  id: 1,
  companyId: 1,
  companyName: 'Default Company',
  email: 'admin@peluclic.com',
  // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- test hash, not a real password
  passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash',
  role: USER_ROLE.ADMIN,
  status: USER_STATUS.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const mockSession: Session = {
  id: 1,
  token: '550e8400-e29b-41d4-a716-446655440000',
  userId: 1,
  companyId: 1,
  expiresAt: new Date('2026-07-24T00:00:00Z'),
  createdAt: new Date('2026-07-23T00:00:00Z'),
  deletedAt: null,
};

function makeRepository(overrides?: Partial<IAuthRepository>): IAuthRepository {
  return {
    findUserByEmail: vi.fn().mockResolvedValue(null),
    createSession: vi.fn().mockResolvedValue(mockSession),
    findValidSession: vi.fn().mockResolvedValue(null),
    invalidateSession: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makePasswordService(overrides?: Partial<IPasswordService>): IPasswordService {
  return {
    hash: vi.fn().mockResolvedValue('$argon2id$hashed'),
    verify: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

describe('LoginUseCase', () => {
  let repository: IAuthRepository;
  let passwordService: IPasswordService;
  let useCase: LoginUseCase;

  beforeEach(() => {
    repository = makeRepository();
    passwordService = makePasswordService();
    useCase = new LoginUseCase(repository, passwordService);
  });

  it('returns token and user on valid credentials', async () => {
    // Arrange: user exists and password matches
    vi.mocked(repository.findUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(passwordService.verify).mockResolvedValue(true);

    const result = await useCase.execute('admin@peluclic.com', 'correct-password');

    expect(result).toEqual({
      token: mockSession.token,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        companyId: mockUser.companyId,
        companyName: 'Default Company',
      },
    });
    expect(repository.findUserByEmail).toHaveBeenCalledWith('admin@peluclic.com');
    expect(passwordService.verify).toHaveBeenCalledWith('correct-password', mockUser.passwordHash);
    expect(repository.createSession).toHaveBeenCalledOnce();
  });

  it('throws InvalidCredentialsError when password is wrong', async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(passwordService.verify).mockResolvedValue(false);

    await expect(
      useCase.execute('admin@peluclic.com', 'wrong-password'),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(repository.createSession).not.toHaveBeenCalled();
  });

  it('throws InvalidCredentialsError when email is unknown', async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(null);

    await expect(
      useCase.execute('unknown@example.com', 'any-password'),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(passwordService.verify).not.toHaveBeenCalled();
    expect(repository.createSession).not.toHaveBeenCalled();
  });

  it('throws validation error when password is shorter than 8 characters', async () => {
    await expect(
      useCase.execute('admin@peluclic.com', 'short'),
    ).rejects.toThrow('Password must be at least 8 characters');
    expect(repository.findUserByEmail).not.toHaveBeenCalled();
  });

  it('throws validation error when email is empty', async () => {
    await expect(
      useCase.execute('', 'valid-password123'),
    ).rejects.toThrow('Email is required');
    expect(repository.findUserByEmail).not.toHaveBeenCalled();
  });

  it('throws validation error when password is empty', async () => {
    await expect(
      useCase.execute('admin@peluclic.com', ''),
    ).rejects.toThrow('Password must be at least 8 characters');
    expect(repository.findUserByEmail).not.toHaveBeenCalled();
  });

  it('session is created with 24-hour expiry', async () => {
    const before = Date.now();
    vi.mocked(repository.findUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(passwordService.verify).mockResolvedValue(true);

    await useCase.execute('admin@peluclic.com', 'correct-password');

    const calledWith = vi.mocked(repository.createSession).mock.calls[0];
    const expiresAt = calledWith[2] as Date;
    const after = Date.now();

    // expiresAt should be roughly 24 hours from now
    const diffMs = expiresAt.getTime() - before;
    expect(diffMs).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(diffMs).toBeLessThanOrEqual(25 * 60 * 60 * 1000 + (after - before));
  });
});
