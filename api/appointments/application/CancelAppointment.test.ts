/**
 * Tests for CancelAppointmentUseCase.
 *
 * Verifies:
 * - Sets status=3 (CANCELLED) AND deletedAt=NOW()
 * - Returns 404 when appointment does not exist
 * - Returns 404 when appointment is already cancelled (deletedAt != null)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CancelAppointmentUseCase } from './CancelAppointment';
import { IAppointmentRepository } from '../domain/IAppointmentRepository';
import { Appointment, APPOINTMENT_STATUS } from '../domain/Appointment';
import { AppointmentNotFoundError } from '../domain/AppointmentErrors';

function makeAppt(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 5,
    petId: 7,
    clientId: 42,
    scheduledAt: new Date('2026-07-20T14:00:00Z'),
    status: APPOINTMENT_STATUS.PENDING,
    notes: null,
    deletedAt: null,
    createdAt: new Date('2026-07-19T17:00:00Z'),
    updatedAt: new Date('2026-07-19T17:00:00Z'),
    ...overrides,
  };
}

function makeRepo(): IAppointmentRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByDateRange: vi.fn(),
    findByDateRangeWithDetails: vi.fn(),
    existsByPetAndTime: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    hardDelete: vi.fn(),
    hardDeleteByPetId: vi.fn(),
    hardDeleteByClientId: vi.fn(),
    findByClientId: vi.fn(),
  };
}

describe('CancelAppointmentUseCase', () => {
  let repo: IAppointmentRepository;
  let useCase: CancelAppointmentUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new CancelAppointmentUseCase(repo);
  });

  it('sets status=3 and deletedAt on an active appointment', async () => {
    const pending = makeAppt({ status: APPOINTMENT_STATUS.PENDING });
    const now = new Date('2026-07-25T12:00:00Z');
    const cancelled = makeAppt({
      status: APPOINTMENT_STATUS.CANCELLED,
      deletedAt: now,
    });

    vi.mocked(repo.findById).mockResolvedValue(pending);
    vi.mocked(repo.softDelete).mockResolvedValue(cancelled);

    const result = await useCase.execute(5);

    expect(result.status).toBe(APPOINTMENT_STATUS.CANCELLED);
    expect(result.deletedAt).toEqual(now);
    expect(repo.softDelete).toHaveBeenCalledWith(5);
    // Must NOT use the generic update method
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('throws AppointmentNotFoundError (404) when appointment does not exist', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(AppointmentNotFoundError);
    await expect(useCase.execute(999)).rejects.toThrow('999');
  });

  it('throws AppointmentNotFoundError (404) when already soft-deleted', async () => {
    const alreadyDeleted = makeAppt({
      status: APPOINTMENT_STATUS.CANCELLED,
      deletedAt: new Date('2026-07-24T10:00:00Z'),
    });

    vi.mocked(repo.findById).mockResolvedValue(alreadyDeleted);

    await expect(useCase.execute(5)).rejects.toThrow(AppointmentNotFoundError);
    await expect(useCase.execute(5)).rejects.toThrow('5');
  });
});
