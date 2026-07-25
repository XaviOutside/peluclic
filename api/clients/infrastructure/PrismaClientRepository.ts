import { prisma } from '@api/shared/infrastructure/prisma';
import type { Prisma } from '@prisma/client';
import { Client, CreateClientInput, UpdateClientInput } from '../domain/Client';
import { IClientRepository } from '../domain/IClientRepository';
import { PaginatedResult } from '@api/shared/domain/PaginatedResult';

/**
 * Prisma implementation of IClientRepository.
 *
 * Rules enforced here:
 * - All reads filter deleted_at IS NULL (soft-delete pattern)
 * - softDelete sets deletedAt only — the row is never physically removed
 * - search uses $queryRaw with tagged template for parameterized FTS binding
 * - Prisma model results are mapped to domain Client type (camelCase, Date objects)
 * - No domain errors thrown here — caller (use cases / controller) handles error mapping
 */
export class PrismaClientRepository implements IClientRepository {
  async create(data: CreateClientInput): Promise<Client> {
    const row = await prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        phone2: data.phone2 ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
        consentGivenAt: data.consentGivenAt,
        // status defaults to 1 (active) via schema default
      },
    });

    return this.mapToClient(row);
  }

  async findById(id: number): Promise<Client | null> {
    const row = await prisma.client.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!row) return null;

    return this.mapToClient(row);
  }

  async existsById(id: number): Promise<boolean> {
    const row = await prisma.client.findUnique({
      where: { id },
      select: { id: true },
    });

    return row !== null;
  }

  async findAll(page: number, limit: number): Promise<PaginatedResult<Client>> {
    const skip = (page - 1) * limit;
    const where = { deletedAt: null };

    const [rows, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.mapToClient(row)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: number, data: UpdateClientInput): Promise<Client> {
    const updatePayload: Record<string, unknown> = {};

    if (data.name !== undefined) updatePayload['name'] = data.name;
    if (data.email !== undefined) updatePayload['email'] = data.email;
    if (data.phone !== undefined) updatePayload['phone'] = data.phone;
    if (data.phone2 !== undefined) updatePayload['phone2'] = data.phone2;
    if (data.address !== undefined) updatePayload['address'] = data.address;
    if (data.notes !== undefined) updatePayload['notes'] = data.notes;
    if (data.status !== undefined) updatePayload['status'] = data.status;

    const row = await prisma.client.update({
      where: { id },
      data: updatePayload,
    });

    return this.mapToClient(row);
  }

  async softDelete(id: number): Promise<void> {
    await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: number, tx?: Prisma.TransactionClient): Promise<void> {
    const db = tx ?? prisma;
    await db.client.delete({
      where: { id },
    });
  }

  async findByIdIncludeDeleted(id: number): Promise<Client | null> {
    const row = await prisma.client.findUnique({
      where: { id },
    });

    if (!row) return null;

    return this.mapToClient(row);
  }

  async search(sanitizedQuery: string): Promise<Client[]> {
    // Query 1: search clients by own fields (6 cols) via ngram NATURAL LANGUAGE MODE
    const clientRows = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM clients
      WHERE MATCH(name, email, phone, phone2, address, notes)
            AGAINST(${sanitizedQuery} IN NATURAL LANGUAGE MODE)
        AND deleted_at IS NULL
      LIMIT 50
    `;

    // Query 2: search pets by name, breed, notes and get DISTINCT client IDs
    const petRows = await prisma.$queryRaw<Array<{ client_id: number }>>`
      SELECT DISTINCT client_id FROM pets
      WHERE MATCH(name, breed, notes)
            AGAINST(${sanitizedQuery} IN NATURAL LANGUAGE MODE)
        AND deleted_at IS NULL
      LIMIT 50
    `;

    // Merge and deduplicate
    const ids = [
      ...new Set([
        ...clientRows.map((r) => r.id),
        ...petRows.map((r) => r.client_id),
      ]),
    ];

    if (ids.length === 0) return [];

    // Fetch full client records
    const rows = await prisma.client.findMany({
      where: { id: { in: ids }, deletedAt: null },
      orderBy: { id: 'asc' },
    });

    // Fetch pet data for matched clients (for substring post-filter)
    const pets = await prisma.pet.findMany({
      where: { client_id: { in: ids }, deletedAt: null },
      select: { client_id: true, name: true, breed: true, notes: true },
    });
    const petFieldsByClient = new Map<number, string[]>();
    for (const p of pets) {
      const fields = petFieldsByClient.get(p.client_id) ?? [];
      fields.push(p.name, p.breed, p.notes ?? '');
      petFieldsByClient.set(p.client_id, fields);
    }

    // Post-filter: ngram FTS can produce false positives from shared ngrams.
    // Verify the query actually appears as a substring in at least one searched field.
    // Strip accents for comparison (MySQL collation handles this, JS does not).
    const stripAccents = (s: string): string =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const lowerQuery = stripAccents(sanitizedQuery).toLowerCase();
    const fieldMatches = (value: string | null): boolean =>
      value !== null && stripAccents(value).toLowerCase().includes(lowerQuery);

    const matching = rows.filter((row) => {
      if (fieldMatches(row.name)) return true;
      if (fieldMatches(row.email)) return true;
      if (fieldMatches(row.phone)) return true;
      if (fieldMatches(row.phone2)) return true;
      if (fieldMatches(row.address)) return true;
      if (fieldMatches(row.notes)) return true;
      const fields = petFieldsByClient.get(row.id);
      return fields?.some((f) => f !== '' && fieldMatches(f)) ?? false;
    });

    return matching.map((row) => this.mapToClient(row));
  }

  /**
   * Maps a Prisma Client model row to the domain Client type.
   * Ensures type safety and consistent field names.
   */
  private mapToClient(row: {
    id: number;
    companyId: number;
    name: string;
    email: string;
    phone: string;
    phone2: string | null;
    address: string | null;
    status: number;
    last_service_date?: Date | null;
    notes?: string | null;
    consentGivenAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Client {
    return {
      id: row.id,
      companyId: row.companyId ?? 1,
      name: row.name,
      email: row.email,
      phone: row.phone,
      phone2: row.phone2,
      address: row.address,
      status: row.status as 0 | 1,
      lastServiceDate: row.last_service_date ?? null,
      notes: row.notes ?? null,
      consentGivenAt: row.consentGivenAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
