/**
 * Appointment domain entity — zero framework or DB imports.
 *
 * Status values are stored as TINYINT in MySQL:
 *   0 = pending, 1 = confirmed, 2 = completed, 3 = cancelled.
 *
 * client_id is denormalized from pet on creation and never updated.
 * Completed appointments (status=2) must not be edited.
 */

export type AppointmentStatus = 0 | 1 | 2 | 3;

export const APPOINTMENT_STATUS = {
  PENDING: 0 as AppointmentStatus,
  CONFIRMED: 1 as AppointmentStatus,
  COMPLETED: 2 as AppointmentStatus,
  CANCELLED: 3 as AppointmentStatus,
} as const;

export const APPOINTMENT_STATUS_LABELS: Record<number, string> = {
  [APPOINTMENT_STATUS.PENDING]: 'pending',
  [APPOINTMENT_STATUS.CONFIRMED]: 'confirmed',
  [APPOINTMENT_STATUS.COMPLETED]: 'completed',
  [APPOINTMENT_STATUS.CANCELLED]: 'cancelled',
};

export const MAX_NOTES_LENGTH = 500;

// ── Entity interface ──────────────────────────────────────────────────────────

export interface Appointment {
  id: number;
  petId: number;
  clientId: number;
  scheduledAt: Date;
  status: AppointmentStatus;
  notes: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended entity that includes joined pet and client names
 * for display in calendar views (avoids N+1 lookups on the frontend).
 */
export interface AppointmentDetails extends Appointment {
  petName: string;
  clientName: string;
}

// ── Input type ────────────────────────────────────────────────────────────────

export interface CreateAppointmentInput {
  petId: number;
  clientId: number;
  scheduledAt: Date;
  notes?: string | null;
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates a new Appointment entity with sensible defaults.
 * Status defaults to PENDING (0). id=0 marks unpersisted.
 */
export function makeAppointment(input: CreateAppointmentInput): Appointment {
  const now = new Date();
  return {
    id: 0,
    petId: input.petId,
    clientId: input.clientId,
    scheduledAt: input.scheduledAt,
    status: APPOINTMENT_STATUS.PENDING,
    notes: input.notes ?? null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validates a CreateAppointmentInput and returns an array of error messages.
 * Empty array means valid.
 */
export function validateAppointment(input: CreateAppointmentInput): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(input.petId) || input.petId <= 0) {
    errors.push('petId must be a positive integer');
  }

  if (!Number.isInteger(input.clientId) || input.clientId <= 0) {
    errors.push('clientId must be a positive integer');
  }

  if (!(input.scheduledAt instanceof Date) || isNaN(input.scheduledAt.getTime())) {
    errors.push('scheduledAt is required and must be a valid Date');
  }

  if (input.notes != null && typeof input.notes === 'string' && input.notes.length > MAX_NOTES_LENGTH) {
    errors.push(`notes must not exceed ${MAX_NOTES_LENGTH} characters`);
  }

  return errors;
}
