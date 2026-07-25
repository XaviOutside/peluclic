/**
 * Repository interface for the appointments bounded context.
 * Domain types only — no Prisma, no Express, no framework imports.
 */
import { Appointment, AppointmentDetails, CreateAppointmentInput } from './Appointment';
import type { Prisma } from '@prisma/client';

export interface IAppointmentRepository {
  /** Persists a new appointment. Returns the created entity with auto-generated id. */
  create(data: CreateAppointmentInput): Promise<Appointment>;

  /** Finds an appointment by its primary key. Returns null if not found. */
  findById(id: number): Promise<Appointment | null>;

  /** Finds all appointments whose scheduled_at falls within [start, end] (inclusive). */
  findByDateRange(start: Date, end: Date): Promise<Appointment[]>;

  /**
   * Same as findByDateRange but LEFT JOINs pet name and client name.
   * Returns AppointmentDetails[] with petName and clientName populated.
   */
  findByDateRangeWithDetails(start: Date, end: Date): Promise<AppointmentDetails[]>;

  /** Checks whether a pet already has an appointment at the exact scheduled time. */
  existsByPetAndTime(petId: number, scheduledAt: Date): Promise<boolean>;

  /** Updates an existing appointment. Returns the updated entity. */
  update(id: number, data: Partial<Pick<Appointment, 'status' | 'notes' | 'scheduledAt'>>): Promise<Appointment>;

  /** Sets status=3 AND deletedAt=NOW() on the appointment. Returns the updated entity. */
  softDelete(id: number): Promise<Appointment>;

  /** Permanently removes a single appointment row. */
  hardDelete(id: number): Promise<void>;

  /** Permanently removes all appointments for a given pet, optionally preserving certain statuses. */
  hardDeleteByPetId(petId: number, excludeStatus?: number[], tx?: Prisma.TransactionClient): Promise<void>;

  /** Permanently removes all appointments for a given client. Preserves status=2 (completed). */
  hardDeleteByClientId(clientId: number): Promise<void>;

  /** Finds all appointments for a given client, including soft-deleted. */
  findByClientId(clientId: number): Promise<Appointment[]>;
}
