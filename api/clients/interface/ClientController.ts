import type { Request, Response } from 'express';
import { logger } from '@api/observability/logger';
import { CreateClientUseCase } from '../application/CreateClient';
import { GetClientUseCase } from '../application/GetClient';
import { ListClientsUseCase } from '../application/ListClients';
import { UpdateClientUseCase } from '../application/UpdateClient';
import { DeactivateClientUseCase } from '../application/DeactivateClient';
import { ReactivateClientUseCase } from '../application/ReactivateClient';
import { SoftDeleteClientUseCase } from '../application/SoftDeleteClient';
import { SearchClientsUseCase } from '../application/SearchClients';
import {
  ClientNotFoundError,
  ClientValidationError,
  ClientAlreadyDeletedError,
} from '../domain/ClientErrors';
import { toClientResponseDto } from './dtos/ClientResponseDto';
import type { CreateClientDto } from './dtos/CreateClientDto';
import type { UpdateClientDto } from './dtos/UpdateClientDto';

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
  if (err instanceof ClientNotFoundError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof ClientValidationError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(422).json({ error: err.message });
    return;
  }

  if (err instanceof ClientAlreadyDeletedError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(409).json({ error: err.message });
    return;
  }

  // Unknown error — log message only, never stack or PII in response
  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error({ errorName: err instanceof Error ? err.name : 'UnknownError' }, message);
  res.status(500).json({ error: 'Internal server error' });
}

export class ClientController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly getClientUseCase: GetClientUseCase,
    private readonly listClientsUseCase: ListClientsUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly deactivateClientUseCase: DeactivateClientUseCase,
    private readonly reactivateClientUseCase: ReactivateClientUseCase,
    private readonly softDeleteClientUseCase: SoftDeleteClientUseCase,
    private readonly searchClientsUseCase: SearchClientsUseCase,
  ) {}

  async createClient(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as CreateClientDto;
      const client = await this.createClientUseCase.execute(body);
      res.status(201).json(toClientResponseDto(client));
    } catch (err) {
      handleError(err, res);
    }
  }

  async getClient(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid client id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      const client = await this.getClientUseCase.execute(id);
      res.status(200).json(toClientResponseDto(client));
    } catch (err) {
      handleError(err, res);
    }
  }

  async listClients(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined;
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined;

      const result = await this.listClientsUseCase.execute({ page, limit });
      res.status(200).json({
        data: result.data.map(toClientResponseDto),
        meta: result.meta,
      });
    } catch (err) {
      handleError(err, res);
    }
  }

  async updateClient(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid client id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    const body = req.body as UpdateClientDto & { status?: unknown };

    // status field is forbidden in PUT — deactivation uses PATCH /:id/deactivate
    if ('status' in body && body.status !== undefined) {
      logger.warn({ id }, 'PUT /clients/:id received forbidden status field');
      res.status(422).json({ error: 'status field is not allowed in PUT. Use PATCH /:id/deactivate instead.' });
      return;
    }

    try {
      const { name, email, phone, phone2, address, notes } = body;
      const client = await this.updateClientUseCase.execute(id, {
        name,
        email,
        phone,
        phone2,
        address,
        notes,
      });
      res.status(200).json(toClientResponseDto(client));
    } catch (err) {
      handleError(err, res);
    }
  }

  async deactivateClient(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid client id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      const client = await this.deactivateClientUseCase.execute(id);
      res.status(200).json(toClientResponseDto(client));
    } catch (err) {
      handleError(err, res);
    }
  }

  async reactivateClient(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid client id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      const client = await this.reactivateClientUseCase.execute(id);
      res.status(200).json(toClientResponseDto(client));
    } catch (err) {
      handleError(err, res);
    }
  }

  async deleteClient(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid client id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      await this.softDeleteClientUseCase.execute(id);
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  }

  async searchClients(req: Request, res: Response): Promise<void> {
    const q = req.query['q'];

    if (q === undefined || q === '') {
      logger.warn("Search request missing 'q' parameter");
      res.status(400).json({ error: "Query parameter 'q' is required" });
      return;
    }

    try {
      const clients = await this.searchClientsUseCase.execute({ query: q as string });
      res.status(200).json(clients.map(toClientResponseDto));
    } catch (err) {
      handleError(err, res);
    }
  }
}
