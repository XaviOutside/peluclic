/**
 * Tests for UpdateAppointmentUseCase.
 *
 * Verifies:
 * - Cancel: status 0→3 (any→cancelled allowed)
 * - Confirm: status 0→1 (pending↔confirmed allowed)
 * - Un-confirm: status 1→0 (pending↔confirmed allowed)
 * - Completed: status 2→any -> rejected (ImmutableCompletedError)
 * - Update notes on non-completed
 * - Reschedule: re-check double-booking on changed scheduledAt
 * - Not found → 404
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateAppointmentUseCase } from './UpdateAppointment';
import { IAppointmentRepository } from '../domain/IAppointmentRepository';
import { Appointment, APPOINTMENT_STATUS } from '../domain/Appointment';
import {
  AppointmentNotFoundError,
  AppointmentValidationError,
  AppointmentConflictError,
} from '../domain/AppointmentErrors';

const baseScheduledAt = new Date('2026-07-20T14:00:00Z');

function makeAppt(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 5,
    petId: 7,
    clientId: 42,
    scheduledAt: baseScheduledAt,
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
    existsByPetAndTime: vi.fn().mockResolvedValue(false),
    update: vi.fn(),
    softDelete: vi.fn(),
    hardDelete: vi.fn(),
    hardDeleteByPetId: vi.fn(),
    hardDeleteByClientId: vi.fn(),
    findByClientId: vi.fn(),
  };
}

describe('UpdateAppointmentUseCase', () => {
  let repo: IAppointmentRepository;
  let useCase: UpdateAppointmentUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new UpdateAppointmentUseCase(repo);
  });

  // ── Cancel (any → cancelled) ───────────────────────────────────────────────

  it('cancels a pending appointment (status 0 → 3)', async () => {
    const pending = makeAppt({ status: APPOINTMENT_STATUS.PENDING });
    const cancelled = makeAppt({ status: APPOINTMENT_STATUS.CANCELLED });
    vi.mocked(repo.findById).mockResolvedValue(pending);
    vi.mocked(repo.update).mockResolvedValue(cancelled);

    const result = await useCase.execute(5, { status: APPOINTMENT_STATUS.CANCELLED });

    expect(result.status).toBe(APPOINTMENT_STATUS.CANCELLED);
    expect(repo.update).toHaveBeenCalledWith(5, { status: APPOINTMENT_STATUS.CANCELLED });
  });

  it('cancels a confirmed appointment (status 1 → 3)', async () => {
    const confirmed = makeAppt({ status: APPOINTMENT_STATUS.CONFIRMED });
    const cancelled = makeAppt({ status: APPOINTMENT_STATUS.CANCELLED });
    vi.mocked(repo.findById).mockResolvedValue(confirmed);
    vi.mocked(repo.update).mockResolvedValue(cancelled);

    const result = await useCase.execute(5, { status: APPOINTMENT_STATUS.CANCELLED });

    expect(result.status).toBe(APPOINTMENT_STATUS.CANCELLED);
  });

  // ── Confirm / un-confirm →──────────────────────────────────────────────────

  it('confirms a pending appointment (status 0 → 1)', async () => {
    const pending = makeAppt({ status: APPOINTMENT_STATUS.PENDING });
    const confirmed = makeAppt({ status: APPOINTMENT_STATUS.CONFIRMED });
    vi.mocked(repo.findById).mockResolvedValue(pending);
    vi.mocked(repo.update).mockResolvedValue(confirmed);

    const result = await useCase.execute(5, { status: APPOINTMENT_STATUS.CONFIRMED });

    expect(result.status).toBe(APPOINTMENT_STATUS.CONFIRMED);
  });

  it('un-confirms a confirmed appointment (status 1 → 0)', async () => {
    const confirmed = makeAppt({ status: APPOINTMENT_STATUS.CONFIRMED });
    const pending = makeAppt({ status: APPOINTMENT_STATUS.PENDING });
    vi.mocked(repo.findById).mockResolvedValue(confirmed);
    vi.mocked(repo.update).mockResolvedValue(pending);

    const result = await useCase.execute(5, { status: APPOINTMENT_STATUS.PENDING });

    expect(result.status).toBe(APPOINTMENT_STATUS.PENDING);
  });

  // ── Completed → immutable ──────────────────────────────────────────────────

  it('rejects edit to a completed appointment (status 2 → any change)', async () => {
    const completed = makeAppt({ status: APPOINTMENT_STATUS.COMPLETED });
    vi.mocked(repo.findById).mockResolvedValue(completed);

    await expect(
      useCase.execute(3, { status: APPOINTMENT_STATUS.CANCELLED }),
    ).rejects.toThrow(AppointmentValidationError);

    await expect(
      useCase.execute(3, { status: APPOINTMENT_STATUS.CANCELLED }),
    ).rejects.toThrow('completed appointments cannot be modified');
  });

  it('rejects notes update on a completed appointment', async () => {
    const completed = makeAppt({ status: APPOINTMENT_STATUS.COMPLETED });
    vi.mocked(repo.findById).mockResolvedValue(completed);

    await expect(
      useCase.execute(3, { notes: 'New notes' }),
    ).rejects.toThrow(AppointmentValidationError);
  });

  // ── Cancelled (soft-deleted) → immutable ──────────────────────────────────

  it('rejects edit to a soft-deleted appointment (deletedAt != null)', async () => {
    const cancelled = makeAppt({
      status: APPOINTMENT_STATUS.CANCELLED,
      deletedAt: new Date('2026-07-24T10:00:00Z'),
    });
    vi.mocked(repo.findById).mockResolvedValue(cancelled);

    await expect(
      useCase.execute(3, { status: APPOINTMENT_STATUS.CONFIRMED }),
    ).rejects.toThrow(AppointmentValidationError);

    await expect(
      useCase.execute(3, { status: APPOINTMENT_STATUS.CONFIRMED }),
    ).rejects.toThrow('cancelled appointments cannot be modified');
  });

  it('rejects notes update on a soft-deleted appointment', async () => {
    const cancelled = makeAppt({
      status: APPOINTMENT_STATUS.CANCELLED,
      deletedAt: new Date('2026-07-24T10:00:00Z'),
    });
    vi.mocked(repo.findById).mockResolvedValue(cancelled);

    await expect(
      useCase.execute(3, { notes: 'New notes' }),
    ).rejects.toThrow(AppointmentValidationError);
  });

  // ── Update notes on non-completed ──────────────────────────────────────────

  it('updates notes on a pending appointment', async () => {
    const pending = makeAppt();
    const updated = makeAppt({ notes: 'New notes' });
    vi.mocked(repo.findById).mockResolvedValue(pending);
    vi.mocked(repo.update).mockResolvedValue(updated);

    const result = await useCase.execute(5, { notes: 'New notes' });

    expect(result.notes).toBe('New notes');
    expect(repo.update).toHaveBeenCalledWith(5, { notes: 'New notes' });
  });

  // ── Reschedule with double-booking check ───────────────────────────────────

  it('allows reschedule when no conflict', async () => {
    const pending = makeAppt();
    const newTime = new Date('2026-07-21T10:00:00Z');
    const rescheduled = makeAppt({ scheduledAt: newTime });
    vi.mocked(repo.findById).mockResolvedValue(pending);
    vi.mocked(repo.existsByPetAndTime).mockResolvedValue(false);
    vi.mocked(repo.update).mockResolvedValue(rescheduled);

    const result = await useCase.execute(5, { scheduledAt: newTime });

    expect(result.scheduledAt).toEqual(newTime);
    expect(repo.existsByPetAndTime).toHaveBeenCalledWith(7, newTime);
  });

  it('rejects reschedule when double-booking exists', async () => {
    const pending = makeAppt();
    const newTime = new Date('2026-07-21T10:00:00Z');
    vi.mocked(repo.findById).mockResolvedValue(pending);
    vi.mocked(repo.existsByPetAndTime).mockResolvedValue(true);

    await expect(
      useCase.execute(5, { scheduledAt: newTime }),
    ).rejects.toThrow(AppointmentConflictError);
  });

  it('does not check double-booking when scheduledAt unchanged', async () => {
    const pending = makeAppt();
    vi.mocked(repo.findById).mockResolvedValue(pending);

    await useCase.execute(5, { status: APPOINTMENT_STATUS.CONFIRMED });

    expect(repo.existsByPetAndTime).not.toHaveBeenCalled();
  });

  // ── Not found → 404 ───────────────────────────────────────────────────────

  it('throws AppointmentNotFoundError when appointment does not exist', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute(999, { status: APPOINTMENT_STATUS.CONFIRMED }),
    ).rejects.toThrow(AppointmentNotFoundError);

    await expect(
      useCase.execute(999, { status: APPOINTMENT_STATUS.CONFIRMED }),
    ).rejects.toThrow('999');
  });

  // ── Combined update ────────────────────────────────────────────────────────

  it('allows updating both status and notes simultaneously', async () => {
    const pending = makeAppt();
    const updated = makeAppt({
      status: APPOINTMENT_STATUS.CONFIRMED,
      notes: 'Updated',
    });
    vi.mocked(repo.findById).mockResolvedValue(pending);
    vi.mocked(repo.update).mockResolvedValue(updated);

    const result = await useCase.execute(5, {
      status: APPOINTMENT_STATUS.CONFIRMED,
      notes: 'Updated',
    });

    expect(result.status).toBe(APPOINTMENT_STATUS.CONFIRMED);
    expect(result.notes).toBe('Updated');
  });
});
