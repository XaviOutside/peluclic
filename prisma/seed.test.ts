import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';

// RED: These imports will fail because the functions don't exist yet in seed.ts
import { seedCompany, seedAdminUser } from './seed';

const prisma = new PrismaClient();

const SEED_COMPANY_NAME = 'Bark & Bubbles';
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;

if (!SEED_ADMIN_EMAIL) {
  throw new Error('SEED_ADMIN_EMAIL must be set in .env to run seed tests');
}

describe('seedCompany', () => {
  it('creates the default company when none exists', async () => {
    // Ensure clean state: delete any existing company with name matching seed
    await prisma.$executeRawUnsafe(`DELETE FROM companies WHERE name = ?`, SEED_COMPANY_NAME);

    const company = await seedCompany(prisma, SEED_COMPANY_NAME);

    expect(company).toBeDefined();
    expect(company.name).toBe(SEED_COMPANY_NAME);
    expect(company.status).toBe(1); // active

    // Verify it was persisted
    const count = await prisma.company.count({
      where: { name: SEED_COMPANY_NAME },
    });
    expect(count).toBe(1);
  });

  it('is idempotent — running twice produces exactly one row', async () => {
    // Clean state: delete any existing row with this name
    await prisma.$executeRawUnsafe(`DELETE FROM companies WHERE name = ?`, SEED_COMPANY_NAME);

    // First run — should create the company
    await seedCompany(prisma, SEED_COMPANY_NAME);
    const countAfterFirst = await prisma.company.count({
      where: { name: SEED_COMPANY_NAME },
    });

    // Second run — should be a no-op (INSERT IGNORE)
    await seedCompany(prisma, SEED_COMPANY_NAME);
    const countAfterSecond = await prisma.company.count({
      where: { name: SEED_COMPANY_NAME },
    });

    expect(countAfterFirst).toBe(1);
    expect(countAfterSecond).toBe(1); // no duplicate
  });
});

describe('seedAdminUser', () => {
  it('creates the admin user when none exists', async () => {
    // Ensure clean state
    await prisma.$executeRawUnsafe(`DELETE FROM users WHERE email = ?`, SEED_ADMIN_EMAIL);

    // Find the company first
    const company = await prisma.company.findFirst({
      where: { name: SEED_COMPANY_NAME },
      select: { id: true },
    });
    const companyId = company?.id || 1;

    const user = await seedAdminUser(prisma, companyId, SEED_ADMIN_EMAIL, 'testpassword123');

    expect(user).toBeDefined();
    expect(user.email).toBe(SEED_ADMIN_EMAIL);
    expect(user.role).toBe(0); // admin
    expect(user.status).toBe(1); // active
    expect(user.companyId).toBe(companyId);
    // Password hash should NOT be the plaintext password
    expect(user.passwordHash).not.toBe('testpassword123');
    // Hash should be long enough for argon2id (≥ 60 chars)
    expect(user.passwordHash.length).toBeGreaterThanOrEqual(60);

    // Verify persisted
    const count = await prisma.user.count({
      where: { email: SEED_ADMIN_EMAIL },
    });
    expect(count).toBe(1);
  });

  it('is idempotent — running twice produces exactly one admin user', async () => {
    const company = await prisma.company.findFirst({
      where: { name: SEED_COMPANY_NAME },
      select: { id: true },
    });
    const companyId = company?.id || 1;

    // First run
    await seedAdminUser(prisma, companyId, SEED_ADMIN_EMAIL, 'testpassword123');
    const countAfterFirst = await prisma.user.count({
      where: { email: SEED_ADMIN_EMAIL },
    });

    // Second run — should be a no-op
    await seedAdminUser(prisma, companyId, SEED_ADMIN_EMAIL, 'testpassword123');
    const countAfterSecond = await prisma.user.count({
      where: { email: SEED_ADMIN_EMAIL },
    });

    expect(countAfterFirst).toBe(1);
    expect(countAfterSecond).toBe(1); // no duplicate
  });

  it('hashes the password with argon2id (different hash for different passwords)', async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM users WHERE email = ?`, SEED_ADMIN_EMAIL);

    const company = await prisma.company.findFirst({
      where: { name: SEED_COMPANY_NAME },
      select: { id: true },
    });
    const companyId = company?.id || 1;

    const user1 = await seedAdminUser(prisma, companyId, SEED_ADMIN_EMAIL, 'passwordA');
    const hashA = user1.passwordHash;

    // Delete and re-create with different password
    await prisma.$executeRawUnsafe(`DELETE FROM users WHERE email = ?`, SEED_ADMIN_EMAIL);
    const user2 = await seedAdminUser(prisma, companyId, SEED_ADMIN_EMAIL, 'passwordB');
    const hashB = user2.passwordHash;

    // Different passwords must produce different hashes
    expect(hashA).not.toBe(hashB);
    // Both must start with $argon2id$
    expect(hashA).toMatch(/^\$argon2id\$/);
    expect(hashB).toMatch(/^\$argon2id\$/);
  });
});
