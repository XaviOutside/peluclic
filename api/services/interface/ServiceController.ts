import type { Request, Response } from 'express';
import { logger } from '@api/observability/logger';
import { CreateServiceUseCase } from '../application/CreateService';
import { GetServiceUseCase } from '../application/GetService';
import { ListServicesUseCase } from '../application/ListServices';
import { UpdateServiceUseCase } from '../application/UpdateService';
import { DeactivateServiceUseCase } from '../application/DeactivateService';
import { SoftDeleteServiceUseCase } from '../application/SoftDeleteService';
import { SearchServicesUseCase } from '../application/SearchServices';
import {
  NotFoundError,
  ValidationError,
  AlreadyDeletedError,
} from '@api/shared/domain/errors';
import { toServiceResponseDto } from './dtos/ServiceResponseDto';
import type { CreateServiceDto } from './dtos/CreateServiceDto';
import type { UpdateServiceDto } from './dtos/UpdateServiceDto';

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
  if (err instanceof NotFoundError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof ValidationError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(422).json({ error: err.message });
    return;
  }

  if (err instanceof AlreadyDeletedError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(409).json({ error: err.message });
    return;
  }

  // Unknown error — log message only, never stack or PII in response
  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error({ errorName: err instanceof Error ? err.name : 'UnknownError' }, message);
  res.status(500).json({ error: 'Internal server error' });
}

export class ServiceController {
  constructor(
    private readonly createServiceUseCase: CreateServiceUseCase,
    private readonly getServiceUseCase: GetServiceUseCase,
    private readonly listServicesUseCase: ListServicesUseCase,
    private readonly updateServiceUseCase: UpdateServiceUseCase,
    private readonly deactivateServiceUseCase: DeactivateServiceUseCase,
    private readonly softDeleteServiceUseCase: SoftDeleteServiceUseCase,
    private readonly searchServicesUseCase: SearchServicesUseCase,
  ) {}

  async createService(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as CreateServiceDto;
      const service = await this.createServiceUseCase.execute({
        name: body.name,
        description: body.description,
        durationMinutes: body.durationMinutes,
        price: Math.round(body.price * 100), // dollars → cents
        petId: body.petId,
      });
      res.status(201).json(toServiceResponseDto(service));
    } catch (err) {
      handleError(err, res);
    }
  }

  async getService(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid service id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      const service = await this.getServiceUseCase.execute(id);
      res.status(200).json(toServiceResponseDto(service));
    } catch (err) {
      handleError(err, res);
    }
  }

  async listServices(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined;
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined;
      const petId = req.query['petId'] ? parseInt(req.query['petId'] as string, 10) : undefined;

      const result = await this.listServicesUseCase.execute({ page, limit, petId });
      res.status(200).json({
        data: result.data.map(toServiceResponseDto),
        meta: result.meta,
      });
    } catch (err) {
      handleError(err, res);
    }
  }

  async updateService(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid service id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    const body = req.body as UpdateServiceDto & { status?: unknown };

    // status field is forbidden in PUT — deactivation uses PATCH /:id/deactivate
    if ('status' in body && body.status !== undefined) {
      logger.warn({ id }, 'PUT /services/:id received forbidden status field');
      res.status(422).json({ error: 'status field is not allowed in PUT. Use PATCH /:id/deactivate instead.' });
      return;
    }

    try {
      const service = await this.updateServiceUseCase.execute(id, {
        name: body.name,
        description: body.description,
        durationMinutes: body.durationMinutes,
        price: body.price !== undefined ? Math.round(body.price * 100) : undefined, // dollars → cents
        petId: body.petId,
      });
      res.status(200).json(toServiceResponseDto(service));
    } catch (err) {
      handleError(err, res);
    }
  }

  async deactivateService(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid service id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      const service = await this.deactivateServiceUseCase.execute(id);
      res.status(200).json(toServiceResponseDto(service));
    } catch (err) {
      handleError(err, res);
    }
  }

  async deleteService(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid service id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      await this.softDeleteServiceUseCase.execute(id);
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  }

  async searchServices(req: Request, res: Response): Promise<void> {
    const q = req.query['q'];

    if (q === undefined || q === '') {
      logger.warn("Search request missing 'q' parameter");
      res.status(400).json({ error: "Query parameter 'q' is required" });
      return;
    }

    try {
      const services = await this.searchServicesUseCase.execute({ query: q as string });
      res.status(200).json(services.map(toServiceResponseDto));
    } catch (err) {
      handleError(err, res);
    }
  }
}
