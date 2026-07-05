/**
 * Integration tests for PrismaPetRepository.
 * @integration — requires Docker MySQL running (npm run test:integration)
 *
 * These tests use a real MySQL connection via DATABASE_URL.
 * Each test cleans up after itself to maintain isolation.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@api/shared/infrastructure/prisma';
import { PrismaPetRepository } from './PrismaPetRepository';
import { PET_STATUS } from '../domain/Pet';

const repo = new PrismaPetRepository();

// --- Seed helpers ---

interface SeedClientOptions {
  name: string;
  email: string;
  status?: number;
  deletedAt?: Date | null;
}

async function seedClient(opts: SeedClientOptions) {
  return await prisma.client.create({
    data: {
      name: opts.name,
      email: opts.email,
      phone: '555-0000',
      phone2: null,
      address: null,
      status: opts.status ?? 1,
      deletedAt: opts.deletedAt ?? null,
    },
  });
}

interface SeedPetOptions {
  client_id: number;
  name: string;
  species: string;
  breed?: string;
  sex?: number;
  dateOfBirth?: Date | null;
  weightKg?: number | null;
  notes?: string | null;
  status?: number;
  deletedAt?: Date | null;
}

async function seedPet(opts: SeedPetOptions) {
  return await prisma.pet.create({
    data: {
      client_id: opts.client_id,
      name: opts.name,
      species: opts.species,
      breed: opts.breed ?? 'Unknown',
      sex: opts.sex ?? 0,
      dateOfBirth: opts.dateOfBirth ?? null,
      weightKg: opts.weightKg ?? null,
      notes: opts.notes ?? null,
      status: opts.status ?? PET_STATUS.ACTIVE,
      deletedAt: opts.deletedAt ?? null,
    },
  });
}

// Track IDs per test for cleanup
let petIds: number[] = [];
let clientIds: number[] = [];

beforeEach(() => {
  petIds = [];
  clientIds = [];
});

afterEach(async () => {
  if (petIds.length > 0) {
    await prisma.pet.deleteMany({ where: { id: { in: petIds } } });
  }
  if (clientIds.length > 0) {
    await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
  }
});

describe('PrismaPetRepository', () => {
  describe('create', () => {
    it('inserts a pet and returns it with id, timestamps, and proper types', async () => {
      const client = await seedClient({ name: 'Owner', email: 'owner@example.com' });
      clientIds.push(client.id);

      const result = await repo.create({
        client_id: client.id,
        name: 'Rex',
        species: 'Dog',
        breed: 'German Shepherd',
        sex: 1,
        dateOfBirth: new Date('2020-01-15'),
        weightKg: 32.5,
        notes: 'Friendly dog',
      });

      petIds.push(result.id);

      expect(result.id).toBeTypeOf('number');
      expect(result.id).toBeGreaterThan(0);
      expect(result.client_id).toBe(client.id);
      expect(result.name).toBe('Rex');
      expect(result.species).toBe('Dog');
      expect(result.breed).toBe('German Shepherd');
      expect(result.sex).toBe(1);
      expect(result.dateOfBirth).toBeInstanceOf(Date);
      expect(result.weightKg).toBeCloseTo(32.5);
      expect(result.notes).toBe('Friendly dog');
      expect(result.status).toBe(PET_STATUS.ACTIVE);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.deletedAt).toBeNull();
    });

    it('defaults sex to 0 (unknown) and status to active', async () => {
      const client = await seedClient({ name: 'Minimal', email: 'minimal@example.com' });
      clientIds.push(client.id);

      const result = await repo.create({
        client_id: client.id,
        name: 'Mittens',
        species: 'Cat',
        breed: 'Tabby',
      });

      petIds.push(result.id);

      expect(result.sex).toBe(0);
      expect(result.status).toBe(PET_STATUS.ACTIVE);
    });
  });

  describe('findById', () => {
    it('returns the pet when found and not deleted', async () => {
      const client = await seedClient({ name: 'Owner2', email: 'owner2@example.com' });
      clientIds.push(client.id);

      const seeded = await seedPet({ client_id: client.id, name: 'Bella', species: 'Cat' });
      petIds.push(seeded.id);

      const found = await repo.findById(seeded.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(seeded.id);
      expect(found!.name).toBe('Bella');
      expect(found!.client_id).toBe(client.id);
    });

    it('returns null when pet does not exist', async () => {
      const found = await repo.findById(9999999);
      expect(found).toBeNull();
    });

    it('returns null when pet is soft-deleted', async () => {
      const client = await seedClient({ name: 'Owner3', email: 'owner3@example.com' });
      clientIds.push(client.id);

      const seeded = await seedPet({
        client_id: client.id,
        name: 'Deleted Pet',
        species: 'Bird',
        deletedAt: new Date(),
      });
      petIds.push(seeded.id);

      const found = await repo.findById(seeded.id);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns paginated, non-deleted pets', async () => {
      const client = await seedClient({ name: 'PagOwner', email: 'pagowner@example.com' });
      clientIds.push(client.id);

      const p1 = await seedPet({ client_id: client.id, name: 'Pet A', species: 'Dog' });
      const p2 = await seedPet({ client_id: client.id, name: 'Pet B', species: 'Cat' });
      const deleted = await seedPet({ client_id: client.id, name: 'Deleted', species: 'Bird', deletedAt: new Date() });
      petIds.push(p1.id, p2.id, deleted.id);

      const results = await repo.findAll(1, 50);

      const ids = results.map((p) => p.id);
      expect(ids).toContain(p1.id);
      expect(ids).toContain(p2.id);
      expect(ids).not.toContain(deleted.id);
    });

    it('respects page and limit for pagination', async () => {
      const client = await seedClient({ name: 'PagePetOwner', email: 'pagepet@example.com' });
      clientIds.push(client.id);

      const pa = await seedPet({ client_id: client.id, name: 'PagePet A', species: 'Dog' });
      const pb = await seedPet({ client_id: client.id, name: 'PagePet B', species: 'Cat' });
      petIds.push(pa.id, pb.id);

      const page1 = await repo.findAll(1, 1);
      const page2 = await repo.findAll(2, 1);

      expect(page1.length).toBeLessThanOrEqual(1);
      expect(page2.length).toBeLessThanOrEqual(1);
    });
  });

  describe('findAllByClientId', () => {
    it('returns only pets belonging to the given client', async () => {
      const owner = await seedClient({ name: 'SpecOwner', email: 'specowner@example.com' });
      const other = await seedClient({ name: 'Other', email: 'other@example.com' });
      clientIds.push(owner.id, other.id);

      const mine = await seedPet({ client_id: owner.id, name: 'Mine', species: 'Dog' });
      const theirs = await seedPet({ client_id: other.id, name: 'Theirs', species: 'Cat' });
      petIds.push(mine.id, theirs.id);

      const results = await repo.findAllByClientId(owner.id, 1, 20);

      const ids = results.map((p) => p.id);
      expect(ids).toContain(mine.id);
      expect(ids).not.toContain(theirs.id);
    });

    it('excludes soft-deleted pets', async () => {
      const owner = await seedClient({ name: 'ByClientDel', email: 'bycl@example.com' });
      clientIds.push(owner.id);

      const active = await seedPet({ client_id: owner.id, name: 'Active', species: 'Dog' });
      const deleted = await seedPet({ client_id: owner.id, name: 'Deleted', species: 'Cat', deletedAt: new Date() });
      petIds.push(active.id, deleted.id);

      const results = await repo.findAllByClientId(owner.id, 1, 20);

      const ids = results.map((p) => p.id);
      expect(ids).toContain(active.id);
      expect(ids).not.toContain(deleted.id);
    });
  });

  describe('existsById', () => {
    it('returns true for an active, non-deleted pet', async () => {
      const client = await seedClient({ name: 'ExistsOwner', email: 'existso@example.com' });
      clientIds.push(client.id);

      const seeded = await seedPet({ client_id: client.id, name: 'Exists', species: 'Dog' });
      petIds.push(seeded.id);

      const exists = await repo.existsById(seeded.id);
      expect(exists).toBe(true);
    });

    it('returns true for a soft-deleted pet (row still exists)', async () => {
      const client = await seedClient({ name: 'DelExistsOwner', email: 'delexistso@example.com' });
      clientIds.push(client.id);

      const seeded = await seedPet({
        client_id: client.id,
        name: 'DelExists',
        species: 'Cat',
        deletedAt: new Date(),
      });
      petIds.push(seeded.id);

      const exists = await repo.existsById(seeded.id);
      expect(exists).toBe(true);
    });

    it('returns false when pet does not exist at all', async () => {
      const exists = await repo.existsById(9999999);
      expect(exists).toBe(false);
    });
  });

  describe('update', () => {
    it('modifies fields and returns the updated pet', async () => {
      const client = await seedClient({ name: 'UpdOwner', email: 'upd@example.com' });
      clientIds.push(client.id);

      const seeded = await seedPet({ client_id: client.id, name: 'Before', species: 'Dog' });
      petIds.push(seeded.id);

      const updated = await repo.update(seeded.id, {
        name: 'After',
        breed: 'Labrador',
        sex: 2,
        weightKg: 25.0,
        notes: 'Updated notes',
      });

      expect(updated.id).toBe(seeded.id);
      expect(updated.name).toBe('After');
      expect(updated.breed).toBe('Labrador');
      expect(updated.sex).toBe(2);
      expect(updated.weightKg).toBeCloseTo(25.0);
      expect(updated.notes).toBe('Updated notes');
      expect(updated.species).toBe('Dog'); // unchanged
    });

    it('can update client_id to a different valid client', async () => {
      const clientA = await seedClient({ name: 'Client A', email: 'clia@example.com' });
      const clientB = await seedClient({ name: 'Client B', email: 'clib@example.com' });
      clientIds.push(clientA.id, clientB.id);

      const seeded = await seedPet({ client_id: clientA.id, name: 'Transfer', species: 'Cat' });
      petIds.push(seeded.id);

      const updated = await repo.update(seeded.id, { client_id: clientB.id });

      expect(updated.client_id).toBe(clientB.id);
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt so findById returns null afterwards', async () => {
      const client = await seedClient({ name: 'SoftDel', email: 'softdel@example.com' });
      clientIds.push(client.id);

      const seeded = await seedPet({ client_id: client.id, name: 'To Delete', species: 'Dog' });
      petIds.push(seeded.id);

      await repo.softDelete(seeded.id);

      // Row still physically exists
      const raw = await prisma.pet.findUnique({ where: { id: seeded.id } });
      expect(raw).not.toBeNull();
      expect(raw!.deletedAt).not.toBeNull();

      // findById returns null
      const found = await repo.findById(seeded.id);
      expect(found).toBeNull();
    });
  });

  describe('search', () => {
    it('returns pets matching name, breed, or notes via FULLTEXT (excludes deleted)', async () => {
      const client = await seedClient({ name: 'SearchOwner', email: 'searcho@example.com' });
      clientIds.push(client.id);

      const ts = Date.now();
      const match = await seedPet({
        client_id: client.id,
        name: `Rex${ts}`,
        species: 'Dog',
        breed: 'Husky',
        notes: 'Loves snow',
      });
      const deleted = await seedPet({
        client_id: client.id,
        name: `Rex${ts} Del`,
        species: 'Dog',
        breed: 'Husky',
        notes: 'Deleted one',
        deletedAt: new Date(),
      });
      const noMatch = await seedPet({
        client_id: client.id,
        name: 'Max',
        species: 'Cat',
        breed: 'Persian',
        notes: 'Lazy cat',
      });
      petIds.push(match.id, deleted.id, noMatch.id);

      const results = await repo.search(`Rex${ts}`);

      const ids = results.map((p) => p.id);
      expect(ids).toContain(match.id);
      expect(ids).not.toContain(deleted.id);
      expect(ids).not.toContain(noMatch.id);
    });

    it('returns empty array when no results match', async () => {
      const results = await repo.search('zzz_no_match_xyz_999999');
      expect(results).toEqual([]);
    });
  });

  describe('clientExistsAndIsActive', () => {
    it('returns true for an active, non-deleted client', async () => {
      const client = await seedClient({ name: 'ActiveClient', email: 'activec@example.com' });
      clientIds.push(client.id);

      const exists = await repo.clientExistsAndIsActive(client.id);
      expect(exists).toBe(true);
    });

    it('returns false when client is deleted', async () => {
      const client = await seedClient({ name: 'DeadClient', email: 'deadc@example.com', deletedAt: new Date() });
      clientIds.push(client.id);

      const exists = await repo.clientExistsAndIsActive(client.id);
      expect(exists).toBe(false);
    });

    it('returns false when client is inactive', async () => {
      const client = await seedClient({ name: 'InactiveClient', email: 'inactivec@example.com', status: 0 });
      clientIds.push(client.id);

      const exists = await repo.clientExistsAndIsActive(client.id);
      expect(exists).toBe(false);
    });

    it('returns false when client does not exist', async () => {
      const exists = await repo.clientExistsAndIsActive(9999999);
      expect(exists).toBe(false);
    });
  });

  describe('deactivateAllByClientId', () => {
    it('sets status=0 for all non-deleted pets of a client', async () => {
      const owner = await seedClient({ name: 'DeactOwner', email: 'deacto@example.com' });
      const other = await seedClient({ name: 'Unaffected', email: 'unaff@example.com' });
      clientIds.push(owner.id, other.id);

      const p1 = await seedPet({ client_id: owner.id, name: 'Deact 1', species: 'Dog' });
      const p2 = await seedPet({ client_id: owner.id, name: 'Deact 2', species: 'Cat' });
      const otherPet = await seedPet({ client_id: other.id, name: 'Safe', species: 'Bird' });
      const deleted = await seedPet({
        client_id: owner.id,
        name: 'Already Del',
        species: 'Fish',
        deletedAt: new Date(),
      });
      petIds.push(p1.id, p2.id, otherPet.id, deleted.id);

      await repo.deactivateAllByClientId(owner.id);

      const after1 = await prisma.pet.findUnique({ where: { id: p1.id } });
      const after2 = await prisma.pet.findUnique({ where: { id: p2.id } });
      const afterOther = await prisma.pet.findUnique({ where: { id: otherPet.id } });
      const afterDel = await prisma.pet.findUnique({ where: { id: deleted.id } });

      expect(after1!.status).toBe(0);
      expect(after2!.status).toBe(0);
      expect(afterOther!.status).toBe(PET_STATUS.ACTIVE); // unaffected
      expect(afterDel!.deletedAt).not.toBeNull(); // still deleted, unchanged
    });
  });

  describe('softDeleteAllByClientId', () => {
    it('sets deletedAt for all non-deleted pets of a client', async () => {
      const owner = await seedClient({ name: 'CascadeDelOwner', email: 'cascadedel@example.com' });
      const other = await seedClient({ name: 'SafeOther', email: 'safeother@example.com' });
      clientIds.push(owner.id, other.id);

      const p1 = await seedPet({ client_id: owner.id, name: 'Cascade 1', species: 'Dog' });
      const p2 = await seedPet({ client_id: owner.id, name: 'Cascade 2', species: 'Cat' });
      const otherPet = await seedPet({ client_id: other.id, name: 'Safe Pet', species: 'Bird' });
      petIds.push(p1.id, p2.id, otherPet.id);

      await repo.softDeleteAllByClientId(owner.id);

      const raw1 = await prisma.pet.findUnique({ where: { id: p1.id } });
      const raw2 = await prisma.pet.findUnique({ where: { id: p2.id } });
      const rawOther = await prisma.pet.findUnique({ where: { id: otherPet.id } });

      expect(raw1!.deletedAt).not.toBeNull();
      expect(raw2!.deletedAt).not.toBeNull();
      expect(rawOther!.deletedAt).toBeNull(); // unaffected
    });

    it('skips already-deleted pets', async () => {
      const owner = await seedClient({ name: 'SkipDelOwner', email: 'skipdel@example.com' });
      clientIds.push(owner.id);

      const alreadyDeleted = await seedPet({
        client_id: owner.id,
        name: 'PrevDeleted',
        species: 'Dog',
        deletedAt: new Date('2020-01-01'),
      });
      petIds.push(alreadyDeleted.id);

      await repo.softDeleteAllByClientId(owner.id);

      // already-deleted should keep its original deletedAt
      const raw = await prisma.pet.findUnique({ where: { id: alreadyDeleted.id } });
      expect(raw!.deletedAt).toEqual(new Date('2020-01-01'));
    });
  });
});
