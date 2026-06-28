/**
 * Integration tests for PrismaServiceRepository.
 * @integration — requires Docker MySQL running (npm run test:integration)
 *
 * These tests use a real MySQL connection via DATABASE_URL.
 * Each test cleans up after itself to maintain isolation.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@api/shared/infrastructure/prisma';
import { PrismaServiceRepository } from './PrismaServiceRepository';
import { Service, SERVICE_STATUS } from '../domain/Service';

const repo = new PrismaServiceRepository();

// --- Seed helpers ---

interface SeedServiceOptions {
  name: string;
  description?: string | null;
  durationMinutes?: number | null;
  price: number;
  status?: number;
  deletedAt?: Date | null;
}

async function seedService(opts: SeedServiceOptions): Promise<Service> {
  const row = await prisma.service.create({
    data: {
      name: opts.name,
      description: opts.description ?? null,
      durationMinutes: opts.durationMinutes ?? null,
      price: opts.price,
      status: opts.status ?? SERVICE_STATUS.ACTIVE,
      deletedAt: opts.deletedAt ?? null,
    },
  });

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.durationMinutes,
    price: row.price,
    status: row.status as 0 | 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

// Track IDs per test for cleanup
let serviceIds: number[] = [];

beforeEach(() => {
  serviceIds = [];
});

afterEach(async () => {
  if (serviceIds.length > 0) {
    await prisma.service.deleteMany({ where: { id: { in: serviceIds } } });
  }
});

describe('PrismaServiceRepository', () => {
  describe('create', () => {
    it('inserts a service and returns it with id, timestamps, and proper types', async () => {
      const result = await repo.create({
        name: 'Full Groom',
        description: 'Complete grooming package',
        durationMinutes: 60,
        price: 5000,
      });

      serviceIds.push(result.id);

      expect(result.id).toBeTypeOf('number');
      expect(result.id).toBeGreaterThan(0);
      expect(result.name).toBe('Full Groom');
      expect(result.description).toBe('Complete grooming package');
      expect(result.durationMinutes).toBe(60);
      expect(result.price).toBe(5000);
      expect(result.status).toBe(SERVICE_STATUS.ACTIVE);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.deletedAt).toBeNull();
    });

    it('defaults description and durationMinutes to null when omitted', async () => {
      const result = await repo.create({
        name: 'Bath Only',
        price: 2500,
      });

      serviceIds.push(result.id);

      expect(result.description).toBeNull();
      expect(result.durationMinutes).toBeNull();
      expect(result.status).toBe(SERVICE_STATUS.ACTIVE);
    });
  });

  describe('findById', () => {
    it('returns the service when found and not deleted', async () => {
      const seeded = await seedService({
        name: 'Nail Trim',
        description: 'Nail clipping service',
        price: 1500,
      });
      serviceIds.push(seeded.id);

      const found = await repo.findById(seeded.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(seeded.id);
      expect(found!.name).toBe('Nail Trim');
      expect(found!.description).toBe('Nail clipping service');
      expect(found!.price).toBe(1500);
    });

    it('returns null when service does not exist', async () => {
      const found = await repo.findById(9999999);
      expect(found).toBeNull();
    });

    it('returns null when service is soft-deleted', async () => {
      const seeded = await seedService({
        name: 'Deleted Service',
        price: 1000,
        deletedAt: new Date(),
      });
      serviceIds.push(seeded.id);

      const found = await repo.findById(seeded.id);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns paginated, non-deleted services', async () => {
      const s1 = await seedService({ name: 'Service A', price: 1000 });
      const s2 = await seedService({ name: 'Service B', price: 2000 });
      const deleted = await seedService({ name: 'Deleted', price: 500, deletedAt: new Date() });
      serviceIds.push(s1.id, s2.id, deleted.id);

      const results = await repo.findAll(1, 50);

      const ids = results.map((s) => s.id);
      expect(ids).toContain(s1.id);
      expect(ids).toContain(s2.id);
      expect(ids).not.toContain(deleted.id);
    });

    it('respects page and limit for pagination', async () => {
      const sa = await seedService({ name: 'Page A', price: 1000 });
      const sb = await seedService({ name: 'Page B', price: 2000 });
      serviceIds.push(sa.id, sb.id);

      const page1 = await repo.findAll(1, 1);
      const page2 = await repo.findAll(2, 1);

      expect(page1.length).toBeLessThanOrEqual(1);
      expect(page2.length).toBeLessThanOrEqual(1);
    });
  });

  describe('update', () => {
    it('modifies fields and returns the updated service', async () => {
      const seeded = await seedService({
        name: 'Before Update',
        description: 'Old description',
        durationMinutes: 30,
        price: 3000,
      });
      serviceIds.push(seeded.id);

      const updated = await repo.update(seeded.id, {
        name: 'After Update',
        description: 'New description',
        durationMinutes: 45,
        price: 4000,
      });

      expect(updated.id).toBe(seeded.id);
      expect(updated.name).toBe('After Update');
      expect(updated.description).toBe('New description');
      expect(updated.durationMinutes).toBe(45);
      expect(updated.price).toBe(4000);
    });

    it('only updates provided fields', async () => {
      const seeded = await seedService({
        name: 'Partial Update',
        description: 'Keep this',
        durationMinutes: 20,
        price: 2000,
      });
      serviceIds.push(seeded.id);

      const updated = await repo.update(seeded.id, {
        name: 'Renamed',
      });

      expect(updated.name).toBe('Renamed');
      expect(updated.description).toBe('Keep this'); // unchanged
      expect(updated.durationMinutes).toBe(20); // unchanged
      expect(updated.price).toBe(2000); // unchanged
    });
  });

  describe('update status', () => {
    it('applies status change when provided in update input', async () => {
      const seeded = await seedService({
        name: 'Status Change Test',
        price: 1000,
        status: SERVICE_STATUS.ACTIVE,
      });
      serviceIds.push(seeded.id);

      const updated = await repo.update(seeded.id, { status: SERVICE_STATUS.INACTIVE });

      expect(updated.status).toBe(SERVICE_STATUS.INACTIVE);
    });

    it('only updates status when status is the only field provided', async () => {
      const seeded = await seedService({
        name: 'Partial Status',
        description: 'Keep me',
        durationMinutes: 30,
        price: 2000,
        status: SERVICE_STATUS.INACTIVE,
      });
      serviceIds.push(seeded.id);

      const updated = await repo.update(seeded.id, { status: SERVICE_STATUS.ACTIVE });

      expect(updated.status).toBe(SERVICE_STATUS.ACTIVE);
      expect(updated.name).toBe('Partial Status'); // unchanged
      expect(updated.description).toBe('Keep me'); // unchanged
      expect(updated.price).toBe(2000); // unchanged
    });
  });

  describe('existsById', () => {
    it('returns true for an active, non-deleted service', async () => {
      const seeded = await seedService({
        name: 'Exists Check',
        price: 1000,
      });
      serviceIds.push(seeded.id);

      const exists = await repo.existsById(seeded.id);
      expect(exists).toBe(true);
    });

    it('returns true for a soft-deleted service (row still exists)', async () => {
      const seeded = await seedService({
        name: 'Still Exists',
        price: 1000,
        deletedAt: new Date(),
      });
      serviceIds.push(seeded.id);

      const exists = await repo.existsById(seeded.id);
      expect(exists).toBe(true);
    });

    it('returns false when service does not exist at all', async () => {
      const exists = await repo.existsById(9999999);
      expect(exists).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt so findById returns null afterwards', async () => {
      const seeded = await seedService({ name: 'To Delete', price: 1000 });
      serviceIds.push(seeded.id);

      await repo.softDelete(seeded.id);

      // Row still physically exists
      const raw = await prisma.service.findUnique({ where: { id: seeded.id } });
      expect(raw).not.toBeNull();
      expect(raw!.deletedAt).not.toBeNull();

      // findById returns null
      const found = await repo.findById(seeded.id);
      expect(found).toBeNull();
    });
  });

  describe('search', () => {
    it('returns services matching name or description via FULLTEXT (excludes deleted)', async () => {
      const ts = Date.now();
      const match = await seedService({
        name: `Groom${ts}`,
        description: 'Full service',
        price: 5000,
      });
      const deleted = await seedService({
        name: `Groom${ts} Del`,
        description: 'Deleted one',
        price: 5000,
        deletedAt: new Date(),
      });
      const noMatch = await seedService({
        name: 'Bath Only',
        description: 'Wash and dry',
        price: 2000,
      });
      serviceIds.push(match.id, deleted.id, noMatch.id);

      const results = await repo.search(`Groom${ts}`);

      const ids = results.map((s) => s.id);
      expect(ids).toContain(match.id);
      expect(ids).not.toContain(deleted.id);
      expect(ids).not.toContain(noMatch.id);
    });

    it('returns empty array when no results match', async () => {
      const results = await repo.search('zzz_no_match_xyz_999999');
      expect(results).toEqual([]);
    });

    it('matches by description text', async () => {
      const ts = Date.now();
      const match = await seedService({
        name: 'Basic Wash',
        description: `haircut${ts} premium service`,
        price: 3000,
      });
      serviceIds.push(match.id);

      const results = await repo.search(`haircut${ts}`);

      const ids = results.map((s) => s.id);
      expect(ids).toContain(match.id);
    });
  });
});
