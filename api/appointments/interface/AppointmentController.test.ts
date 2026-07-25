/**
 * Supertest tests for AppointmentController routes.
 * Use cases are mocked — no DB connection required.
 *
 * Follows the existing ClientController.test.ts pattern:
 *   - Mock use case classes with vi.fn() execute methods
 *   - Create an Express app with the router
 *   - Test all routes and error mappings
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { AppointmentController } from './AppointmentController';
import { createAppointmentRouter } from './appointmentRouter';
import {
  AppointmentNotFoundError,
  AppointmentValidationError,
  AppointmentConflictError,
} from '../domain/AppointmentErrors';
import { APPOINTMENT_STATUS } from '../domain/Appointment';
import type { Appointment } from '../domain/Appointment';
import type { CreateAppointmentUseCase } from '../application/CreateAppointment';
import type { GetAppointmentUseCase } from '../application/GetAppointment';
import type { ListAppointmentsUseCase } from '../application/ListAppointments';
import type { UpdateAppointmentUseCase } from '../application/UpdateAppointment';
import type { CancelAppointmentUseCase } from '../application/CancelAppointment';

/** Stable domain appointment fixture */
const domainAppointment: Appointment = {
  id: 1,
  petId: 7,
  clientId: 42,
  scheduledAt: new Date('2026-07-20T14:00:00.000Z'),
  status: APPOINTMENT_STATUS.PENDING,
  notes: 'First visit',
  createdAt: new Date('2026-07-19T10:00:00.000Z'),
  updatedAt: new Date('2026-07-19T10:00:00.000Z'),
};

/** Expected DTO shape for domainAppointment */
const expectedDto = {
  id: 1,
  petId: 7,
  petName: '',
  clientId: 42,
  clientName: '',
  scheduledAt: '2026-07-20T14:00:00.000Z',
  status: 0,
  notes: 'First visit',
  createdAt: '2026-07-19T10:00:00.000Z',
  updatedAt: '2026-07-19T10:00:00.000Z',
};

// Mock use case instances
const mockCreate = { execute: vi.fn() } as unknown as CreateAppointmentUseCase;
const mockGet = { execute: vi.fn() } as unknown as GetAppointmentUseCase;
const mockList = { execute: vi.fn(), executeWithDetails: vi.fn() } as unknown as ListAppointmentsUseCase;
const mockUpdate = { execute: vi.fn() } as unknown as UpdateAppointmentUseCase;
const mockCancel = { execute: vi.fn() } as unknown as CancelAppointmentUseCase;

const controller = new AppointmentController(
  mockCreate,
  mockGet,
  mockList,
  mockUpdate,
  mockCancel,
);

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/appointments', createAppointmentRouter(controller));
  // Generic error boundary for unexpected throws
  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── POST /api/v1/appointments ─────────────────────────────────────────────

describe('POST /api/v1/appointments', () => {
  it('returns 201 with AppointmentResponseDto on success', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(domainAppointment);

    const res = await request(makeApp())
      .post('/api/v1/appointments')
      .send({ petId: 7, scheduledAt: '2026-07-20T14:00:00.000Z', notes: 'First visit' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(expectedDto);
  });

  it('returns 404 when pet is not found (AppointmentNotFoundError)', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new AppointmentNotFoundError(99),
    );

    const res = await request(makeApp())
      .post('/api/v1/appointments')
      .send({ petId: 99, scheduledAt: '2026-07-20T14:00:00.000Z' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body).not.toHaveProperty('stack');
  });

  it('returns 409 on double-booking conflict (AppointmentConflictError)', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new AppointmentConflictError('Pet 7 already has an appointment'),
    );

    const res = await request(makeApp())
      .post('/api/v1/appointments')
      .send({ petId: 7, scheduledAt: '2026-07-20T14:00:00.000Z' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 422 on validation error (AppointmentValidationError)', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new AppointmentValidationError('notes too long'),
    );

    const res = await request(makeApp())
      .post('/api/v1/appointments')
      .send({ petId: 7, scheduledAt: '2026-07-20T14:00:00.000Z', notes: 'x'.repeat(501) });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });

  it('passes parsed scheduledAt as Date and notes to the use case', async () => {
    (mockCreate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(domainAppointment);

    await request(makeApp())
      .post('/api/v1/appointments')
      .send({ petId: 7, scheduledAt: '2026-07-20T14:00:00.000Z', notes: 'trim' });

    expect(mockCreate.execute).toHaveBeenCalledWith({
      petId: 7,
      scheduledAt: expect.any(Date),
      notes: 'trim',
    });
    const callArg = (mockCreate.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.scheduledAt.toISOString()).toBe('2026-07-20T14:00:00.000Z');
  });
});

// ── GET /api/v1/appointments?start=&end= ───────────────────────────────────

describe('GET /api/v1/appointments', () => {
  it('returns 200 with appointment list filtered by date range', async () => {
    (mockList.executeWithDetails as ReturnType<typeof vi.fn>).mockResolvedValueOnce([domainAppointment]);

    const res = await request(makeApp())
      .get('/api/v1/appointments?start=2026-07-20&end=2026-07-26');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject(expectedDto);
  });

  it('returns 200 with empty array when no appointments in range', async () => {
    (mockList.executeWithDetails as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const res = await request(makeApp())
      .get('/api/v1/appointments?start=2026-07-20&end=2026-07-26');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 422 when start is not before end (AppointmentValidationError)', async () => {
    (mockList.executeWithDetails as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new AppointmentValidationError('start must be before end'),
    );

    const res = await request(makeApp())
      .get('/api/v1/appointments?start=2026-07-26&end=2026-07-20');

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when start or end query param is missing', async () => {
    const res = await request(makeApp()).get('/api/v1/appointments');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when start or end is not a valid date', async () => {
    const res = await request(makeApp())
      .get('/api/v1/appointments?start=invalid&end=2026-07-26');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ── GET /api/v1/appointments/:id ──────────────────────────────────────────

describe('GET /api/v1/appointments/:id', () => {
  it('returns 200 with appointment', async () => {
    (mockGet.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(domainAppointment);

    const res = await request(makeApp()).get('/api/v1/appointments/1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(expectedDto);
  });

  it('returns 404 when not found', async () => {
    (mockGet.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new AppointmentNotFoundError(999),
    );

    const res = await request(makeApp()).get('/api/v1/appointments/999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 422 when id is non-numeric', async () => {
    const res = await request(makeApp()).get('/api/v1/appointments/abc');

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 422 when id is zero or negative', async () => {
    const res = await request(makeApp()).get('/api/v1/appointments/0');

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });
});

// ── PATCH /api/v1/appointments/:id ────────────────────────────────────────

describe('PATCH /api/v1/appointments/:id', () => {
  it('returns 200 with updated appointment on status transition', async () => {
    const confirmed: Appointment = { ...domainAppointment, status: APPOINTMENT_STATUS.CONFIRMED };
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(confirmed);

    const res = await request(makeApp())
      .patch('/api/v1/appointments/1')
      .send({ status: 1 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(1);
  });

  it('returns 200 when cancelling (status=3)', async () => {
    const cancelled: Appointment = { ...domainAppointment, status: APPOINTMENT_STATUS.CANCELLED };
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(cancelled);

    const res = await request(makeApp())
      .patch('/api/v1/appointments/1')
      .send({ status: 3 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(3);
  });

  it('returns 200 when rescheduling', async () => {
    const rescheduled: Appointment = {
      ...domainAppointment,
      scheduledAt: new Date('2026-07-21T10:00:00.000Z'),
    };
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(rescheduled);

    const res = await request(makeApp())
      .patch('/api/v1/appointments/1')
      .send({ scheduledAt: '2026-07-21T10:00:00.000Z' });

    expect(res.status).toBe(200);
    expect(res.body.scheduledAt).toBe('2026-07-21T10:00:00.000Z');
  });

  it('returns 404 when appointment not found', async () => {
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new AppointmentNotFoundError(999),
    );

    const res = await request(makeApp())
      .patch('/api/v1/appointments/999')
      .send({ notes: 'updated' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 422 when editing a completed appointment', async () => {
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new AppointmentValidationError('completed appointments cannot be modified'),
    );

    const res = await request(makeApp())
      .patch('/api/v1/appointments/1')
      .send({ status: 1 });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 409 on reschedule double-booking conflict', async () => {
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new AppointmentConflictError('Pet 7 already has an appointment'),
    );

    const res = await request(makeApp())
      .patch('/api/v1/appointments/1')
      .send({ scheduledAt: '2026-07-20T15:00:00.000Z' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 422 when id is non-numeric', async () => {
    const res = await request(makeApp())
      .patch('/api/v1/appointments/abc')
      .send({ notes: 'updated' });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });

  it('parses scheduledAt string to Date before passing to use case', async () => {
    (mockUpdate.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(domainAppointment);

    await request(makeApp())
      .patch('/api/v1/appointments/1')
      .send({ scheduledAt: '2026-07-21T10:00:00.000Z' });

    expect(mockUpdate.execute).toHaveBeenCalledWith(1, {
      scheduledAt: expect.any(Date),
    });
    const callArg = (mockUpdate.execute as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(callArg.scheduledAt.toISOString()).toBe('2026-07-21T10:00:00.000Z');
  });
});

// ── DELETE /api/v1/appointments/:id (cancel) ──────────────────────────────

describe('DELETE /api/v1/appointments/:id', () => {
  it('returns 200 with soft-deleted appointment (status=3, deletedAt set)', async () => {
    const now = new Date('2026-07-25T12:00:00.000Z');
    const cancelled: Appointment = {
      ...domainAppointment,
      status: APPOINTMENT_STATUS.CANCELLED,
      deletedAt: now,
    };
    (mockCancel.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce(cancelled);

    const res = await request(makeApp()).delete('/api/v1/appointments/1');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(3);
    // Verify the cancel use case (not the update use case) was called
    expect(mockCancel.execute).toHaveBeenCalledWith(1);
  });

  it('returns 404 when appointment not found', async () => {
    (mockCancel.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new AppointmentNotFoundError(999),
    );

    const res = await request(makeApp()).delete('/api/v1/appointments/999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 when appointment is already cancelled (soft-deleted)', async () => {
    (mockCancel.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new AppointmentNotFoundError(1),
    );

    const res = await request(makeApp()).delete('/api/v1/appointments/1');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 422 when id is non-numeric', async () => {
    const res = await request(makeApp()).delete('/api/v1/appointments/abc');

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });
});

// ── Error handling ────────────────────────────────────────────────────────

describe('Error handling', () => {
  it('returns 500 without stack trace for unexpected errors', async () => {
    (mockGet.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Unexpected database error'),
    );

    const res = await request(makeApp()).get('/api/v1/appointments/1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(res.body).not.toHaveProperty('stack');
  });
});
