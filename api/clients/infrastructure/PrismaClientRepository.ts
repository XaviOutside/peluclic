import { prisma } from '@api/shared/infrastructure/prisma';
import { Client, CreateClientInput, UpdateClientInput } from '../domain/Client';
import { IClientRepository } from '../domain/IClientRepository';

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

  async findAll(page: number, limit: number): Promise<Client[]> {
    const skip = (page - 1) * limit;

    const rows = await prisma.client.findMany({
      where: { deletedAt: null },
      skip,
      take: limit,
      orderBy: { id: 'asc' },
    });

    return rows.map((row) => this.mapToClient(row));
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

  async search(sanitizedQuery: string): Promise<Client[]> {
    // $queryRaw with tagged template ensures parameterized binding — no string interpolation
    const rows = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      email: string;
      phone: string;
      phone2: string | null;
      address: string | null;
      status: number;
      last_service_date: Date | null;
      notes: string | null;
      created_at: Date;
      updated_at: Date;
      deleted_at: Date | null;
    }>>`
      SELECT id, name, email, phone, phone2, address, status,
             last_service_date, notes, created_at, updated_at, deleted_at
      FROM clients
      WHERE MATCH(name, email) AGAINST(${sanitizedQuery} IN BOOLEAN MODE)
        AND deleted_at IS NULL
      LIMIT 50
    `;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      phone2: row.phone2,
      address: row.address,
      status: row.status as 0 | 1,
      lastServiceDate: row.last_service_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));
  }

  /**
   * Maps a Prisma Client model row to the domain Client type.
   * Ensures type safety and consistent field names.
   */
  private mapToClient(row: {
    id: number;
    name: string;
    email: string;
    phone: string;
    phone2: string | null;
    address: string | null;
    status: number;
    last_service_date?: Date | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Client {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      phone2: row.phone2,
      address: row.address,
      status: row.status as 0 | 1,
      lastServiceDate: row.last_service_date ?? null,
      notes: row.notes ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
