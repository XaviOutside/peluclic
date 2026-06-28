/**
 * Integration tests for PrismaClientRepository.
 * @integration — requires Docker MySQL running (npm run test:integration)
 *
 * These tests use a real MySQL connection via DATABASE_URL.
 * Each test cleans up after itself to maintain isolation.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@api/shared/infrastructure/prisma';
import { PrismaClientRepository } from './PrismaClientRepository';
import { Client } from '../domain/Client';

const repo = new PrismaClientRepository();

/** Helper to create a client directly via Prisma for setup */
async function seedClient(overrides: Partial<{
  name: string;
  email: string;
  phone: string;
  phone2: string | null;
  address: string | null;
  status: number;
  deletedAt: Date | null;
}> = {}): Promise<Client> {
  const row = await prisma.client.create({
    data: {
      name: overrides.name ?? 'Test Client',
      email: overrides.email ?? `test-${Date.now()}@example.com`,
      phone: overrides.phone ?? '555-1234',
      phone2: overrides.phone2 ?? null,
      address: overrides.address ?? null,
      status: overrides.status ?? 1,
      deletedAt: overrides.deletedAt ?? null,
    },
  });

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    phone2: row.phone2,
    address: row.address,
    status: row.status as 0 | 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

// Track IDs created per test for cleanup
let createdIds: number[] = [];

beforeEach(() => {
  createdIds = [];
});

afterEach(async () => {
  if (createdIds.length > 0) {
    await prisma.client.deleteMany({ where: { id: { in: createdIds } } });
  }
});

describe('PrismaClientRepository', () => {
  describe('create', () => {
    it('inserts a client and returns it with id and timestamps', async () => {
      const result = await repo.create({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0001',
      });

      createdIds.push(result.id);

      expect(result.id).toBeTypeOf('number');
      expect(result.id).toBeGreaterThan(0);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.phone).toBe('555-0001');
      expect(result.phone2).toBeNull();
      expect(result.address).toBeNull();
      expect(result.status).toBe(1);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.deletedAt).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the client when found', async () => {
      const seeded = await seedClient({ name: 'Find Me', email: 'findme@example.com' });
      createdIds.push(seeded.id);

      const found = await repo.findById(seeded.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(seeded.id);
      expect(found!.name).toBe('Find Me');
    });

    it('returns null when not found', async () => {
      const found = await repo.findById(9999999);
      expect(found).toBeNull();
    });

    it('returns null when deletedAt is set', async () => {
      const seeded = await seedClient({ deletedAt: new Date() });
      createdIds.push(seeded.id);

      const found = await repo.findById(seeded.id);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns paginated results and excludes soft-deleted clients', async () => {
      const active1 = await seedClient({ name: 'Active One', email: 'active1@example.com' });
      const active2 = await seedClient({ name: 'Active Two', email: 'active2@example.com' });
      const deleted = await seedClient({ name: 'Deleted', email: 'deleted@example.com', deletedAt: new Date() });
      createdIds.push(active1.id, active2.id, deleted.id);

      const results = await repo.findAll(1, 50);

      const ids = results.map((c) => c.id);
      expect(ids).toContain(active1.id);
      expect(ids).toContain(active2.id);
      expect(ids).not.toContain(deleted.id);
    });

    it('respects page and limit for pagination', async () => {
      const c1 = await seedClient({ name: 'Page Client A', email: 'pagea@example.com' });
      const c2 = await seedClient({ name: 'Page Client B', email: 'pageb@example.com' });
      createdIds.push(c1.id, c2.id);

      const page1 = await repo.findAll(1, 1);
      const page2 = await repo.findAll(2, 1);

      // Each page should return at most 1 result
      expect(page1.length).toBeLessThanOrEqual(1);
      expect(page2.length).toBeLessThanOrEqual(1);
    });
  });

  describe('existsById', () => {
    it('returns true for an active, non-deleted client', async () => {
      const seeded = await seedClient({ name: 'Exists Client', email: 'exists@example.com' });
      createdIds.push(seeded.id);

      const exists = await repo.existsById(seeded.id);
      expect(exists).toBe(true);
    });

    it('returns true for a soft-deleted client (row still exists)', async () => {
      const seeded = await seedClient({ name: 'Del Exists', email: 'delexists@example.com', deletedAt: new Date() });
      createdIds.push(seeded.id);

      const exists = await repo.existsById(seeded.id);
      expect(exists).toBe(true);
    });

    it('returns false when client does not exist at all', async () => {
      const exists = await repo.existsById(9999999);
      expect(exists).toBe(false);
    });
  });

  describe('update', () => {
    it('modifies fields and returns the updated client', async () => {
      const seeded = await seedClient({ name: 'Before Update', email: 'before@example.com' });
      createdIds.push(seeded.id);

      const updated = await repo.update(seeded.id, { name: 'After Update', phone: '555-9999' });

      expect(updated.id).toBe(seeded.id);
      expect(updated.name).toBe('After Update');
      expect(updated.phone).toBe('555-9999');
      expect(updated.email).toBe('before@example.com'); // unchanged
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt so findById returns null afterwards', async () => {
      const seeded = await seedClient({ name: 'To Delete', email: 'todelete@example.com' });
      createdIds.push(seeded.id);

      await repo.softDelete(seeded.id);

      // Row still exists in DB (physical delete not performed)
      const raw = await prisma.client.findUnique({ where: { id: seeded.id } });
      expect(raw).not.toBeNull();
      expect(raw!.deletedAt).not.toBeNull();

      // findById returns null for soft-deleted
      const found = await repo.findById(seeded.id);
      expect(found).toBeNull();
    });
  });

  describe('search', () => {
    it('returns clients matching name or email via FULLTEXT (excludes deleted)', async () => {
      const timestamp = Date.now();
      const active = await seedClient({
        name: `Searchable${timestamp}`,
        email: `search${timestamp}@example.com`,
      });
      const deleted = await seedClient({
        name: `Searchable${timestamp} Deleted`,
        email: `searchdel${timestamp}@example.com`,
        deletedAt: new Date(),
      });
      createdIds.push(active.id, deleted.id);

      const results = await repo.search(`Searchable${timestamp}`);

      const ids = results.map((c) => c.id);
      expect(ids).toContain(active.id);
      expect(ids).not.toContain(deleted.id);
    });

    it('returns empty array when no results match', async () => {
      const results = await repo.search('zzz_no_match_xyz_9999');
      expect(results).toEqual([]);
    });
  });
});
