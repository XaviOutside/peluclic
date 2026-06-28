import { prisma } from '@api/shared/infrastructure/prisma';
import { Service, CreateServiceInput, UpdateServiceInput, SERVICE_STATUS } from '../domain/Service';
import { IServiceRepository } from '../domain/IServiceRepository';

/**
 * Prisma implementation of IServiceRepository.
 *
 * Rules enforced here:
 * - All reads filter deletedAt IS NULL (soft-delete pattern)
 * - softDelete sets deletedAt only — the row is never physically removed
 * - search uses $queryRaw with tagged template for parameterized FTS binding
 * - Prisma model results are mapped to domain Service type (camelCase, Date objects)
 * - No domain errors thrown here — caller (use cases / controller) handles error mapping
 */
export class PrismaServiceRepository implements IServiceRepository {
  async create(data: CreateServiceInput): Promise<Service> {
    const row = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        durationMinutes: data.durationMinutes ?? null,
        price: data.price,
        // status defaults to 1 (active) via schema default
      },
    });

    return this.mapToService(row);
  }

  async findById(id: number): Promise<Service | null> {
    const row = await prisma.service.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!row) return null;

    return this.mapToService(row);
  }

  async existsById(id: number): Promise<boolean> {
    const row = await prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });

    return row !== null;
  }

  async findAll(page: number, limit: number): Promise<Service[]> {
    const skip = (page - 1) * limit;

    const rows = await prisma.service.findMany({
      where: { deletedAt: null },
      skip,
      take: limit,
      orderBy: { id: 'asc' },
    });

    return rows.map((row) => this.mapToService(row));
  }

  async update(id: number, data: UpdateServiceInput): Promise<Service> {
    const updatePayload: Record<string, unknown> = {};

    if (data.name !== undefined) updatePayload['name'] = data.name;
    if (data.description !== undefined) updatePayload['description'] = data.description;
    if (data.durationMinutes !== undefined) updatePayload['durationMinutes'] = data.durationMinutes;
    if (data.price !== undefined) updatePayload['price'] = data.price;
    if (data.status !== undefined) updatePayload['status'] = data.status;

    const row = await prisma.service.update({
      where: { id },
      data: updatePayload,
    });

    return this.mapToService(row);
  }

  async softDelete(id: number): Promise<void> {
    await prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async search(sanitizedQuery: string): Promise<Service[]> {
    // $queryRaw with tagged template ensures parameterized binding — no string interpolation
    const rows = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      description: string | null;
      duration_minutes: number | null;
      price: number;
      status: number;
      created_at: Date;
      updated_at: Date;
      deleted_at: Date | null;
    }>>`
      SELECT id, name, description, duration_minutes, price, status,
             created_at, updated_at, deleted_at
      FROM services
      WHERE MATCH(name, description) AGAINST(${sanitizedQuery} IN BOOLEAN MODE)
        AND deleted_at IS NULL
      LIMIT 50
    `;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      durationMinutes: row.duration_minutes,
      price: row.price,
      status: row.status as 0 | 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));
  }

  /**
   * Maps a Prisma Service model row to the domain Service type.
   * Snakes → camels, TINYINT → union types.
   */
  private mapToService(row: {
    id: number;
    name: string;
    description: string | null;
    durationMinutes: number | null;
    price: number;
    status: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Service {
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
}
