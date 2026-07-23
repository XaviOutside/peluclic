/**
 * Integration tests for PrismaAuthRepository.
 * @integration — requires Docker MySQL running (npm run test:integration)
 *
 * Tests verify:
 * - findUserByEmail returns user with company relation
 * - createSession generates UUID v4 and persists
 * - findValidSession returns SessionWithUser for valid token, null for expired/deleted
 * - invalidateSession soft-deletes the session row
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@api/shared/infrastructure/prisma';
import { PrismaAuthRepository } from './PrismaAuthRepository';
import type { UserRole } from '../domain/User';

const repo = new PrismaAuthRepository();

let seededCompanyId: number;
let seededUserId: number;
const testEmail = `auth-test-${Date.now()}@example.com`;

async function seedCompany(): Promise<number> {
  const row = await prisma.company.create({
    data: { name: 'Integration Test Co', status: 1 },
    select: { id: true },
  });
  return row.id;
}

async function seedUser(
  companyId: number,
  overrides: { email?: string; role?: UserRole; passwordHash?: string } = {},
): Promise<number> {
  const row = await prisma.user.create({
    data: {
      companyId,
      email: overrides.email ?? testEmail,
      passwordHash: overrides.passwordHash ?? '$argon2id$v=19$m=65536,t=3,p=4$dGVzdHNhbHQ$dGVzdGhhc2g',
      role: overrides.role ?? 1,
      status: 1,
    },
    select: { id: true },
  });
  return row.id;
}

beforeEach(async () => {
  seededCompanyId = await seedCompany();
  seededUserId = await seedUser(seededCompanyId);
});

afterEach(async () => {
  // Clean up in reverse order — sessions first, then user, then company
  await prisma.session.deleteMany({ where: { userId: seededUserId } });
  await prisma.user.deleteMany({ where: { id: seededUserId } });
  await prisma.company.deleteMany({ where: { id: seededCompanyId } });
});

describe('PrismaAuthRepository.findUserByEmail', () => {
  it('returns a User when the email exists', async () => {
    const user = await repo.findUserByEmail(testEmail);

    expect(user).not.toBeNull();
    expect(user!.id).toBe(seededUserId);
    expect(user!.email).toBe(testEmail);
    expect(user!.companyId).toBe(seededCompanyId);
    expect(user!.companyName).toBe('Integration Test Co');
    expect(user!.role).toBe(1);
    expect(user!.passwordHash).toBeDefined();
    expect(user!.createdAt).toBeInstanceOf(Date);
  });

  it('returns null when the email does not exist', async () => {
    const user = await repo.findUserByEmail('nonexistent@example.com');

    expect(user).toBeNull();
  });
});

describe('PrismaAuthRepository.createSession', () => {
  it('creates a session with a UUID v4 token', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await repo.createSession(seededUserId, seededCompanyId, expiresAt);

    expect(session).toBeDefined();
    expect(session.token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(session.userId).toBe(seededUserId);
    expect(session.companyId).toBe(seededCompanyId);
    expect(session.expiresAt.getTime()).toBe(expiresAt.getTime());
    expect(session.deletedAt).toBeNull();

    // Verify it's persisted in the DB
    const row = await prisma.session.findUnique({ where: { token: session.token } });
    expect(row).not.toBeNull();
  });
});

describe('PrismaAuthRepository.findValidSession', () => {
  it('returns SessionWithUser for a valid, non-expired token', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await repo.createSession(seededUserId, seededCompanyId, expiresAt);

    const result = await repo.findValidSession(session.token);

    expect(result).not.toBeNull();
    expect(result!.token).toBe(session.token);
    expect(result!.userId).toBe(seededUserId);
    expect(result!.companyId).toBe(seededCompanyId);
    expect(result!.role).toBe(1);
    expect(result!.companyName).toBe('Integration Test Co');
  });

  it('returns null for a non-existent token', async () => {
    const result = await repo.findValidSession('00000000-0000-0000-0000-000000000000');

    expect(result).toBeNull();
  });

  it('returns null for an expired session', async () => {
    // Create a session that expired 1 hour ago
    const expiresAt = new Date(Date.now() - 60 * 60 * 1000);
    const session = await repo.createSession(seededUserId, seededCompanyId, expiresAt);

    const result = await repo.findValidSession(session.token);

    expect(result).toBeNull();
  });
});

describe('PrismaAuthRepository.invalidateSession', () => {
  it('soft-deletes the session by setting deleted_at', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await repo.createSession(seededUserId, seededCompanyId, expiresAt);

    await repo.invalidateSession(session.token);

    // Verify the session is no longer found as valid
    const valid = await repo.findValidSession(session.token);
    expect(valid).toBeNull();

    // Verify the row still exists but has deleted_at set
    const row = await prisma.session.findUnique({ where: { token: session.token } });
    expect(row).not.toBeNull();
    expect(row!.deletedAt).not.toBeNull();
  });

  it('is idempotent — calling twice does not throw', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await repo.createSession(seededUserId, seededCompanyId, expiresAt);

    await repo.invalidateSession(session.token);
    await expect(repo.invalidateSession(session.token)).resolves.toBeUndefined();
  });

  it('does not throw for a non-existent token', async () => {
    await expect(
      repo.invalidateSession('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined();
  });
});
