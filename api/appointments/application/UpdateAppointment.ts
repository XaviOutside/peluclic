import { Appointment } from '../domain/Appointment';
import { IAppointmentRepository } from '../domain/IAppointmentRepository';
import {
  AppointmentNotFoundError,
  AppointmentValidationError,
  AppointmentConflictError,
} from '../domain/AppointmentErrors';
import { APPOINTMENT_STATUS } from '../domain/Appointment';

export type UpdateAppointmentData = Partial<
  Pick<Appointment, 'status' | 'notes' | 'scheduledAt'>
>;

/**
 * Updates an existing appointment.
 *
 * Business rules:
 * - Appointment MUST exist (404 if not found).
 * - Completed appointments (status=2) CANNOT be modified (422).
 * - Cancelled (soft-deleted) appointments CANNOT be modified (422).
 * - If scheduled_at changes, re-check double-booking (409).
 */
export class UpdateAppointmentUseCase {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(id: number, data: UpdateAppointmentData): Promise<Appointment> {
    // 1. Find existing appointment
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppointmentNotFoundError(id);
    }

    // 2. Completed appointments are immutable
    if (existing.status === APPOINTMENT_STATUS.COMPLETED) {
      throw new AppointmentValidationError(
        'completed appointments cannot be modified',
      );
    }

    // 3. Cancelled (soft-deleted) appointments are immutable
    if (existing.deletedAt !== null) {
      throw new AppointmentValidationError(
        'cancelled appointments cannot be modified',
      );
    }

    // 4. If rescheduling, check for double-booking
    if (
      data.scheduledAt !== undefined &&
      data.scheduledAt.getTime() !== existing.scheduledAt.getTime()
    ) {
      const hasConflict = await this.repository.existsByPetAndTime(
        existing.petId,
        data.scheduledAt,
      );
      if (hasConflict) {
        throw new AppointmentConflictError(
          `Pet ${existing.petId} already has an appointment at ${data.scheduledAt.toISOString()}`,
        );
      }
    }

    // 5. Apply updates
    return this.repository.update(id, data);
  }
}
