import type { Request, Response } from 'express';
import { logger } from '@api/observability/logger';
import { CreateAppointmentUseCase } from '../application/CreateAppointment';
import { GetAppointmentUseCase } from '../application/GetAppointment';
import { ListAppointmentsUseCase } from '../application/ListAppointments';
import { UpdateAppointmentUseCase } from '../application/UpdateAppointment';
import { CancelAppointmentUseCase } from '../application/CancelAppointment';
import { APPOINTMENT_STATUS } from '../domain/Appointment';
import type { AppointmentStatus } from '../domain/Appointment';
import {
  AppointmentNotFoundError,
  AppointmentValidationError,
  AppointmentConflictError,
} from '../domain/AppointmentErrors';
import { toAppointmentResponseDto } from './dtos/AppointmentResponseDto';

/**
 * Parses and validates :id param as a positive integer.
 * Returns the parsed id or null if invalid.
 */
function parsePositiveInt(raw: string): number | null {
  const n = parseInt(raw, 10);
  if (isNaN(n) || n <= 0 || String(n) !== raw) return null;
  return n;
}

/**
 * Maps domain errors to HTTP status codes and response bodies.
 * Unexpected errors return 500 with no stack trace in the body.
 */
function handleError(err: unknown, res: Response): void {
  if (err instanceof AppointmentNotFoundError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof AppointmentConflictError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(409).json({ error: err.message });
    return;
  }

  if (err instanceof AppointmentValidationError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(422).json({ error: err.message });
    return;
  }

  // Unknown error — log message only, never stack or PII in response
  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error({ errorName: err instanceof Error ? err.name : 'UnknownError' }, message);
  res.status(500).json({ error: 'Internal server error' });
}

export class AppointmentController {
  constructor(
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly getAppointmentUseCase: GetAppointmentUseCase,
    private readonly listAppointmentsUseCase: ListAppointmentsUseCase,
    private readonly updateAppointmentUseCase: UpdateAppointmentUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { petId, scheduledAt, notes } = req.body;

      const appointment = await this.createAppointmentUseCase.execute({
        petId,
        scheduledAt: new Date(scheduledAt),
        notes,
      });

      res.status(201).json(toAppointmentResponseDto(appointment));
    } catch (err) {
      handleError(err, res);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid appointment id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      const appointment = await this.getAppointmentUseCase.execute(id);
      res.status(200).json(toAppointmentResponseDto(appointment));
    } catch (err) {
      handleError(err, res);
    }
  }

  async listWeek(req: Request, res: Response): Promise<void> {
    const startRaw = req.query['start'] as string | undefined;
    const endRaw = req.query['end'] as string | undefined;

    if (!startRaw || !endRaw) {
      res.status(400).json({ error: "Query parameters 'start' and 'end' are required (ISO date strings)" });
      return;
    }

    const start = new Date(startRaw);
    const end = new Date(endRaw);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: 'Invalid date format — use ISO 8601 (e.g. 2026-07-20)' });
      return;
    }

    try {
      const appointments = await this.listAppointmentsUseCase.executeWithDetails(start, end);
      res.status(200).json(appointments.map(toAppointmentResponseDto));
    } catch (err) {
      handleError(err, res);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid appointment id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      const { scheduledAt, notes, status } = req.body;

      const updateData: { scheduledAt?: Date; notes?: string | null; status?: AppointmentStatus } = {};

      if (scheduledAt !== undefined) {
        updateData.scheduledAt = new Date(scheduledAt);
      }
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      if (status !== undefined) {
        updateData.status = status as AppointmentStatus;
      }

      const appointment = await this.updateAppointmentUseCase.execute(id, updateData);
      res.status(200).json(toAppointmentResponseDto(appointment));
    } catch (err) {
      handleError(err, res);
    }
  }

  async cancel(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid appointment id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      const appointment = await this.cancelAppointmentUseCase.execute(id);
      res.status(200).json(toAppointmentResponseDto(appointment));
    } catch (err) {
      handleError(err, res);
    }
  }
}
