import { prisma } from '@api/shared/infrastructure/prisma';
import { Pet, CreatePetInput, UpdatePetInput, PET_STATUS } from '../domain/Pet';
import { IPetRepository } from '../domain/IPetRepository';

/**
 * Prisma implementation of IPetRepository.
 *
 * Rules enforced here:
 * - All reads filter deletedAt IS NULL (soft-delete pattern)
 * - softDelete sets deletedAt only — the row is never physically removed
 * - search uses $queryRaw with tagged template for parameterized FTS binding
 * - Prisma model results are mapped to domain Pet type (camelCase, Date objects)
 * - cascade methods use updateMany to affect all non-deleted pets of a client
 * - clientExistsAndIsActive performs a lightweight query against the clients table
 * - No domain errors thrown here — caller (use cases / controller) handles error mapping
 */
export class PrismaPetRepository implements IPetRepository {
  async create(data: CreatePetInput): Promise<Pet> {
    const row = await prisma.pet.create({
      data: {
        client_id: data.client_id,
        name: data.name,
        species: data.species,
        breed: data.breed,
        sex: data.sex ?? 0,
        dateOfBirth: data.dateOfBirth ?? null,
        weightKg: data.weightKg ?? null,
        notes: data.notes ?? null,
        // status defaults to 1 (active) via schema default
      },
    });

    return this.mapToPet(row);
  }

  async findById(id: number): Promise<Pet | null> {
    const row = await prisma.pet.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!row) return null;

    return this.mapToPet(row);
  }

  async findAll(page: number, limit: number): Promise<Pet[]> {
    const skip = (page - 1) * limit;

    const rows = await prisma.pet.findMany({
      where: { deletedAt: null },
      skip,
      take: limit,
      orderBy: { id: 'asc' },
    });

    return rows.map((row) => this.mapToPet(row));
  }

  async findAllByClientId(clientId: number, page: number, limit: number): Promise<Pet[]> {
    const skip = (page - 1) * limit;

    const rows = await prisma.pet.findMany({
      where: {
        client_id: clientId,
        deletedAt: null,
      },
      skip,
      take: limit,
      orderBy: { id: 'asc' },
    });

    return rows.map((row) => this.mapToPet(row));
  }

  async update(id: number, data: UpdatePetInput): Promise<Pet> {
    const updatePayload: Record<string, unknown> = {};

    if (data.client_id !== undefined) updatePayload['client_id'] = data.client_id;
    if (data.name !== undefined) updatePayload['name'] = data.name;
    if (data.species !== undefined) updatePayload['species'] = data.species;
    if (data.breed !== undefined) updatePayload['breed'] = data.breed;
    if (data.sex !== undefined) updatePayload['sex'] = data.sex;
    if (data.dateOfBirth !== undefined) updatePayload['dateOfBirth'] = data.dateOfBirth;
    if (data.weightKg !== undefined) updatePayload['weightKg'] = data.weightKg;
    if (data.notes !== undefined) updatePayload['notes'] = data.notes;
    if (data.status !== undefined) updatePayload['status'] = data.status;

    const row = await prisma.pet.update({
      where: { id },
      data: updatePayload,
    });

    return this.mapToPet(row);
  }

  async softDelete(id: number): Promise<void> {
    await prisma.pet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async search(sanitizedQuery: string): Promise<Pet[]> {
    // $queryRaw with tagged template ensures parameterized binding — no string interpolation
    const rows = await prisma.$queryRaw<Array<{
      id: number;
      client_id: number;
      name: string;
      species: string;
      breed: string;
      sex: number;
      date_of_birth: Date | null;
      weight_kg: number | null;
      notes: string | null;
      status: number;
      created_at: Date;
      updated_at: Date;
      deleted_at: Date | null;
    }>>`
      SELECT id, client_id, name, species, breed, sex,
             date_of_birth, weight_kg, notes, status,
             created_at, updated_at, deleted_at
      FROM pets
      WHERE MATCH(name, breed, notes) AGAINST(${sanitizedQuery} IN BOOLEAN MODE)
        AND deleted_at IS NULL
      LIMIT 50
    `;

    return rows.map((row) => ({
      id: row.id,
      client_id: row.client_id,
      name: row.name,
      species: row.species,
      breed: row.breed,
      sex: row.sex as 0 | 1 | 2,
      dateOfBirth: row.date_of_birth,
      weightKg: row.weight_kg,
      notes: row.notes,
      status: row.status as 0 | 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));
  }

  async clientExistsAndIsActive(clientId: number): Promise<boolean> {
    const row = await prisma.client.findFirst({
      where: {
        id: clientId,
        status: PET_STATUS.ACTIVE,
        deletedAt: null,
      },
      select: { id: true },
    });

    return row !== null;
  }

  async deactivateAllByClientId(clientId: number): Promise<void> {
    await prisma.pet.updateMany({
      where: {
        client_id: clientId,
        deletedAt: null,
      },
      data: { status: PET_STATUS.INACTIVE },
    });
  }

  async softDeleteAllByClientId(clientId: number): Promise<void> {
    await prisma.pet.updateMany({
      where: {
        client_id: clientId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Maps a Prisma Pet model row to the domain Pet type.
   * Snakes → camels, TINYINT → union types, Decimal → number.
   */
  private mapToPet(row: {
    id: number;
    client_id: number;
    name: string;
    species: string;
    breed: string;
    sex: number;
    dateOfBirth: Date | null;
    weightKg: { toNumber: () => number } | number | null;
    notes: string | null;
    status: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Pet {
    return {
      id: row.id,
      client_id: row.client_id,
      name: row.name,
      species: row.species,
      breed: row.breed,
      sex: row.sex as 0 | 1 | 2,
      dateOfBirth: row.dateOfBirth,
      weightKg: typeof row.weightKg === 'object' && row.weightKg !== null && 'toNumber' in row.weightKg
        ? row.weightKg.toNumber()
        : (row.weightKg as number | null),
      notes: row.notes,
      status: row.status as 0 | 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
