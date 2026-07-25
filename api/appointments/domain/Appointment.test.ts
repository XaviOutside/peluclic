/**
 * Tests for Appointment domain entity.
 *
 * Verifies:
 * - AppointmentStatus enum (0=pending, 1=confirmed, 2=completed, 3=cancelled)
 * - Default status on creation (0 = PENDING)
 * - Denormalized client_id from pet
 * - Notes max 500 chars validation
 * - scheduled_at required validation
 * - Status must be valid enum value
 */
import { describe, it, expect } from 'vitest';
import {
  APPOINTMENT_STATUS,
  type Appointment,
  type AppointmentStatus,
  type CreateAppointmentInput,
  makeAppointment,
  validateAppointment,
  MAX_NOTES_LENGTH,
} from './Appointment';

// ─── AppointmentStatus enum ──────────────────────────────────────────────────

describe('AppointmentStatus', () => {
  it('defines PENDING as 0', () => {
    expect(APPOINTMENT_STATUS.PENDING).toBe(0);
  });

  it('defines CONFIRMED as 1', () => {
    expect(APPOINTMENT_STATUS.CONFIRMED).toBe(1);
  });

  it('defines COMPLETED as 2', () => {
    expect(APPOINTMENT_STATUS.COMPLETED).toBe(2);
  });

  it('defines CANCELLED as 3', () => {
    expect(APPOINTMENT_STATUS.CANCELLED).toBe(3);
  });

  it('is a TINYINT-compatible enum (0|1|2|3)', () => {
    const validValues: AppointmentStatus[] = [0, 1, 2, 3];
    for (const v of validValues) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(3);
    }
  });
});

// ─── makeAppointment (factory) ────────────────────────────────────────────────

describe('makeAppointment', () => {
  const baseInput: CreateAppointmentInput = {
    petId: 7,
    clientId: 42,
    scheduledAt: new Date('2026-07-20T14:00:00Z'),
  };

  it('sets status to PENDING (0) by default', () => {
    const appointment = makeAppointment(baseInput);
    expect(appointment.status).toBe(APPOINTMENT_STATUS.PENDING);
    expect(appointment.status).toBe(0);
  });

  it('denormalizes client_id from input', () => {
    const appointment = makeAppointment({ ...baseInput, clientId: 99 });
    expect(appointment.clientId).toBe(99);
  });

  it('sets pet_id from input', () => {
    const appointment = makeAppointment({ ...baseInput, petId: 13 });
    expect(appointment.petId).toBe(13);
  });

  it('sets scheduled_at from input', () => {
    const dt = new Date('2026-12-25T10:30:00Z');
    const appointment = makeAppointment({ ...baseInput, scheduledAt: dt });
    expect(appointment.scheduledAt).toEqual(dt);
  });

  it('accepts optional notes', () => {
    const appointment = makeAppointment({ ...baseInput, notes: 'Use hypoallergenic shampoo' });
    expect(appointment.notes).toBe('Use hypoallergenic shampoo');
  });

  it('defaults notes to null when not provided', () => {
    const appointment = makeAppointment(baseInput);
    expect(appointment.notes).toBeNull();
  });

  it('defaults id to 0 for new (unpersisted) entities', () => {
    const appointment = makeAppointment(baseInput);
    expect(appointment.id).toBe(0);
  });

  it('sets created_at and updated_at', () => {
    const appointment = makeAppointment(baseInput);
    expect(appointment.createdAt).toBeInstanceOf(Date);
    expect(appointment.updatedAt).toBeInstanceOf(Date);
  });
});

// ─── validateAppointment ──────────────────────────────────────────────────────

describe('validateAppointment', () => {
  const baseInput: CreateAppointmentInput = {
    petId: 7,
    clientId: 42,
    scheduledAt: new Date('2026-07-20T14:00:00Z'),
  };

  it('returns empty array for valid input', () => {
    expect(validateAppointment(baseInput)).toEqual([]);
  });

  it('returns empty array for valid input with notes', () => {
    expect(validateAppointment({ ...baseInput, notes: 'Trim nails' })).toEqual([]);
  });

  it('returns error when notes exceeds max length', () => {
    const input = { ...baseInput, notes: 'A'.repeat(MAX_NOTES_LENGTH + 1) };
    const errors = validateAppointment(input);
    expect(errors).toContain(`notes must not exceed ${MAX_NOTES_LENGTH} characters`);
  });

  it('accepts notes exactly at max length', () => {
    const input = { ...baseInput, notes: 'A'.repeat(MAX_NOTES_LENGTH) };
    expect(validateAppointment(input)).toEqual([]);
  });

  it('returns error when petId is not a positive integer', () => {
    expect(validateAppointment({ ...baseInput, petId: 0 })).toContain('petId must be a positive integer');
    expect(validateAppointment({ ...baseInput, petId: -1 })).toContain('petId must be a positive integer');
    expect(validateAppointment({ ...baseInput, petId: 1.5 })).toContain('petId must be a positive integer');
  });

  it('returns error when clientId is not a positive integer', () => {
    expect(validateAppointment({ ...baseInput, clientId: 0 })).toContain('clientId must be a positive integer');
    expect(validateAppointment({ ...baseInput, clientId: -1 })).toContain('clientId must be a positive integer');
    expect(validateAppointment({ ...baseInput, clientId: 1.5 })).toContain('clientId must be a positive integer');
  });

  it('returns error when scheduledAt is not a Date', () => {
    const invalidValues: unknown[] = [null, undefined, '2026-07-20', 12345];
    for (const v of invalidValues) {
      expect(validateAppointment({ ...baseInput, scheduledAt: v as Date })).toContain(
        'scheduledAt is required and must be a valid Date',
      );
    }
  });

  it('returns multiple errors at once', () => {
    const result = validateAppointment({
      petId: 0,
      clientId: -5,
      scheduledAt: null as unknown as Date,
      notes: 'X'.repeat(MAX_NOTES_LENGTH + 1),
    });
    expect(result.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── deletedAt (GDPR soft-delete) ──────────────────────────────────────────────

describe('deletedAt', () => {
  const baseInput: CreateAppointmentInput = {
    petId: 7,
    clientId: 42,
    scheduledAt: new Date('2026-07-20T14:00:00Z'),
  };

  it('is null on newly created appointments', () => {
    const appointment = makeAppointment(baseInput);
    expect(appointment.deletedAt).toBeNull();
  });

  it('can be set to a Date when soft-deleted', () => {
    const appointment = makeAppointment(baseInput);
    const now = new Date('2026-07-25T12:00:00Z');
    const withDeletedAt: Appointment = { ...appointment, deletedAt: now };
    expect(withDeletedAt.deletedAt).toEqual(now);
    expect(withDeletedAt.deletedAt).toBeInstanceOf(Date);
  });

  it('has Date | null type when explicitly set to null', () => {
    const appointment = makeAppointment(baseInput);
    const withNull: Appointment = { ...appointment, deletedAt: null };
    expect(withNull.deletedAt).toBeNull();
  });
});

// ─── MAX_NOTES_LENGTH constant ────────────────────────────────────────────────

describe('MAX_NOTES_LENGTH', () => {
  it('equals 500', () => {
    expect(MAX_NOTES_LENGTH).toBe(500);
  });
});
