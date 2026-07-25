import { Appointment } from '../domain/Appointment';
import { IAppointmentRepository } from '../domain/IAppointmentRepository';
import { AppointmentNotFoundError } from '../domain/AppointmentErrors';

/**
 * Cancels an appointment by soft-deleting it.
 *
 * Business rules:
 * - Appointment MUST exist (404 if not found).
 * - Already-deleted appointments (deletedAt != null) return 404.
 * - Sets status=3 (CANCELLED) AND deletedAt=NOW() atomically via repository.
 */
export class CancelAppointmentUseCase {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(id: number): Promise<Appointment> {
    const existing = await this.repository.findById(id);

    if (!existing || existing.deletedAt !== null) {
      throw new AppointmentNotFoundError(id);
    }

    return this.repository.softDelete(id);
  }
}
