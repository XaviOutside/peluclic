import { prisma } from '@api/shared/infrastructure/prisma';
import { Appointment, AppointmentDetails, CreateAppointmentInput } from '../domain/Appointment';
import { IAppointmentRepository } from '../domain/IAppointmentRepository';

/**
 * Prisma implementation of IAppointmentRepository.
 *
 * Rules enforced here:
 * - create defaults status to 0 (PENDING) via schema default
 * - findByDateRange uses gte/lte on scheduledAt
 * - existsByPetAndTime checks exact pet + scheduledAt match
 * - update only modifies status, notes, and scheduledAt
 * - Maps Prisma snake_case column names to domain camelCase fields
 */
export class PrismaAppointmentRepository implements IAppointmentRepository {
  async create(data: CreateAppointmentInput): Promise<Appointment> {
    const row = await prisma.appointment.create({
      data: {
        pet_id: data.petId,
        client_id: data.clientId,
        scheduledAt: data.scheduledAt,
        notes: data.notes ?? null,
        // status defaults to 0 (PENDING) via schema @default(0)
      },
    });

    return this.mapToAppointment(row);
  }

  async findById(id: number): Promise<Appointment | null> {
    const row = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!row) return null;

    return this.mapToAppointment(row);
  }

  async findByDateRange(start: Date, end: Date): Promise<Appointment[]> {
    const rows = await prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return rows.map((row) => this.mapToAppointment(row));
  }

  async findByDateRangeWithDetails(start: Date, end: Date): Promise<AppointmentDetails[]> {
    // LEFT JOIN pets and clients to get display names.
    // No FK constraints per project rules — plain INT columns.
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        pet_id: number;
        client_id: number;
        scheduledAt: string;
        status: number;
        notes: string | null;
        deletedAt: string | null;
        createdAt: string;
        updatedAt: string;
        pet_name: string;
        client_name: string;
      }>
    >(
      `SELECT
        a.id,
        a.pet_id,
        a.client_id,
        a.scheduled_at AS scheduledAt,
        a.status,
        a.notes,
        a.deleted_at AS deletedAt,
        a.created_at AS createdAt,
        a.updated_at AS updatedAt,
        COALESCE(p.name, '') AS pet_name,
        COALESCE(c.name, '') AS client_name
      FROM appointments a
      LEFT JOIN pets p ON p.id = a.pet_id
      LEFT JOIN clients c ON c.id = a.client_id
      WHERE a.scheduled_at >= ? AND a.scheduled_at <= ?
      ORDER BY a.scheduled_at ASC`,
      start,
      end,
    );

    return rows.map((row) => ({
      id: Number(row.id),
      petId: Number(row.pet_id),
      clientId: Number(row.client_id),
      scheduledAt: new Date(row.scheduledAt),
      status: Number(row.status) as AppointmentDetails['status'],
      notes: row.notes,
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      petName: row.pet_name,
      clientName: row.client_name,
    }));
  }

  async existsByPetAndTime(
    petId: number,
    scheduledAt: Date,
  ): Promise<boolean> {
    const row = await prisma.appointment.findFirst({
      where: {
        pet_id: petId,
        scheduledAt,
      },
      select: { id: true },
    });

    return row !== null;
  }

  async update(
    id: number,
    data: Partial<Pick<Appointment, 'status' | 'notes' | 'scheduledAt'>>,
  ): Promise<Appointment> {
    const updatePayload: Record<string, unknown> = {};

    if (data.status !== undefined) updatePayload['status'] = data.status;
    if (data.notes !== undefined) updatePayload['notes'] = data.notes;
    if (data.scheduledAt !== undefined) updatePayload['scheduledAt'] = data.scheduledAt;

    const row = await prisma.appointment.update({
      where: { id },
      data: updatePayload,
    });

    return this.mapToAppointment(row);
  }

  async softDelete(id: number): Promise<Appointment> {
    const row = await prisma.appointment.update({
      where: { id },
      data: {
        status: 3, // CANCELLED
        deletedAt: new Date(),
      },
    });

    return this.mapToAppointment(row);
  }

  async hardDelete(id: number): Promise<void> {
    await prisma.appointment.delete({
      where: { id },
    });
  }

  async hardDeleteByPetId(petId: number): Promise<void> {
    await prisma.appointment.deleteMany({
      where: { pet_id: petId },
    });
  }

  async hardDeleteByClientId(clientId: number): Promise<void> {
    // Preserves completed appointments (status=2) per GDPR requirements
    await prisma.appointment.deleteMany({
      where: {
        client_id: clientId,
        status: { not: 2 },
      },
    });
  }

  async findByClientId(clientId: number): Promise<Appointment[]> {
    const rows = await prisma.appointment.findMany({
      where: { client_id: clientId },
      orderBy: { scheduledAt: 'asc' },
    });

    return rows.map((row) => this.mapToAppointment(row));
  }

  // ── Private mapper ─────────────────────────────────────────────────────────

  private mapToAppointment(row: {
    id: number;
    pet_id: number;
    client_id: number;
    scheduledAt: Date;
    status: number;
    notes: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Appointment {
    return {
      id: row.id,
      petId: row.pet_id,
      clientId: row.client_id,
      scheduledAt: row.scheduledAt,
      status: row.status as Appointment['status'],
      notes: row.notes,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
