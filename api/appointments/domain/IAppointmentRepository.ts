/**
 * Repository interface for the appointments bounded context.
 * Domain types only — no Prisma, no Express, no framework imports.
 */
import { Appointment, AppointmentDetails, CreateAppointmentInput } from './Appointment';

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

  /** Finds all non-deleted appointments for a given client. */
  findByClientId(clientId: number): Promise<Appointment[]>;
}
