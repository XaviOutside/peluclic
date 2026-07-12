import type { Request, Response } from 'express';
import { logger } from '@api/observability/logger';
import { CreatePetUseCase } from '../application/CreatePet';
import { GetPetUseCase } from '../application/GetPet';
import { ListPetsUseCase } from '../application/ListPets';
import { UpdatePetUseCase } from '../application/UpdatePet';
import { DeactivatePetUseCase } from '../application/DeactivatePet';
import { SoftDeletePetUseCase } from '../application/SoftDeletePet';
import { SearchPetsUseCase } from '../application/SearchPets';
import {
  PetNotFoundError,
  PetValidationError,
  PetAlreadyDeletedError,
} from '../domain/PetErrors';
import { PET_SEX } from '../domain/Pet';
import type { PetSex } from '../domain/Pet';
import { toPetResponseDto } from './dtos/PetResponseDto';
import type { CreatePetDto } from './dtos/CreatePetDto';
import type { UpdatePetDto } from './dtos/UpdatePetDto';

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
 * Maps a string sex value from the API DTO to the domain TINYINT enum.
 */
function mapDtoSex(raw?: string): PetSex | undefined {
  if (raw === undefined) return undefined;
  switch (raw) {
    case 'male':
      return PET_SEX.MALE;
    case 'female':
      return PET_SEX.FEMALE;
    case 'unknown':
      return PET_SEX.UNKNOWN;
    default:
      return undefined;
  }
}

/**
 * Parses an ISO 8601 date string into a Date object.
 * Returns undefined for null/undefined/empty, or null if explicitly null.
 */
function parseDtoDate(raw?: string | null): Date | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === '') return null;
  return new Date(raw);
}

/**
 * Maps domain errors to HTTP status codes and response bodies.
 * Unexpected errors return 500 with no stack trace in the body.
 */
function handleError(err: unknown, res: Response): void {
  if (err instanceof PetNotFoundError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof PetValidationError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(422).json({ error: err.message });
    return;
  }

  if (err instanceof PetAlreadyDeletedError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(409).json({ error: err.message });
    return;
  }

  // Unknown error — log message only, never stack or PII in response
  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error({ errorName: err instanceof Error ? err.name : 'UnknownError' }, message);
  res.status(500).json({ error: 'Internal server error' });
}

export class PetController {
  constructor(
    private readonly createPetUseCase: CreatePetUseCase,
    private readonly getPetUseCase: GetPetUseCase,
    private readonly listPetsUseCase: ListPetsUseCase,
    private readonly updatePetUseCase: UpdatePetUseCase,
    private readonly deactivatePetUseCase: DeactivatePetUseCase,
    private readonly softDeletePetUseCase: SoftDeletePetUseCase,
    private readonly searchPetsUseCase: SearchPetsUseCase,
  ) {}

  async createPet(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as CreatePetDto;
      const pet = await this.createPetUseCase.execute({
        client_id: body.clientId,
        name: body.name,
        species: body.species,
        breed: body.breed ?? '',
        sex: mapDtoSex(body.sex),
        dateOfBirth: parseDtoDate(body.dateOfBirth),
        weightKg: body.weightKg,
        notes: body.notes,
      });
      res.status(201).json(toPetResponseDto(pet));
    } catch (err) {
      handleError(err, res);
    }
  }

  async getPet(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid pet id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      const pet = await this.getPetUseCase.execute(id);
      res.status(200).json(toPetResponseDto(pet));
    } catch (err) {
      handleError(err, res);
    }
  }

  async listPets(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined;
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined;
      const clientId = req.query['clientId']
        ? parseInt(req.query['clientId'] as string, 10)
        : undefined;

      const result = await this.listPetsUseCase.execute({ page, limit, clientId });
      res.status(200).json({
        data: result.data.map(toPetResponseDto),
        meta: result.meta,
      });
    } catch (err) {
      handleError(err, res);
    }
  }

  async updatePet(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid pet id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    const body = req.body as UpdatePetDto & { status?: unknown };

    // status field is forbidden in PUT — deactivation uses PATCH /:id/deactivate
    if ('status' in body && body.status !== undefined) {
      logger.warn({ id }, 'PUT /pets/:id received forbidden status field');
      res.status(422).json({ error: 'status field is not allowed in PUT. Use PATCH /:id/deactivate instead.' });
      return;
    }

    try {
      const { name, species, breed, sex, dateOfBirth, weightKg, notes, clientId } = body;
      const pet = await this.updatePetUseCase.execute(id, {
        name,
        species,
        breed,
        client_id: clientId,
        sex: mapDtoSex(sex),
        dateOfBirth: parseDtoDate(dateOfBirth),
        weightKg,
        notes,
      });
      res.status(200).json(toPetResponseDto(pet));
    } catch (err) {
      handleError(err, res);
    }
  }

  async deactivatePet(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid pet id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      const pet = await this.deactivatePetUseCase.execute(id);
      res.status(200).json(toPetResponseDto(pet));
    } catch (err) {
      handleError(err, res);
    }
  }

  async deletePet(req: Request, res: Response): Promise<void> {
    const rawId = String(req.params['id'] ?? '');
    const id = parsePositiveInt(rawId);

    if (id === null) {
      logger.warn({ id: req.params['id'] }, 'Invalid pet id');
      res.status(422).json({ error: 'Invalid id — must be a positive integer' });
      return;
    }

    try {
      await this.softDeletePetUseCase.execute(id);
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  }

  async searchPets(req: Request, res: Response): Promise<void> {
    const q = req.query['q'];

    if (q === undefined || q === '') {
      logger.warn("Search request missing 'q' parameter");
      res.status(400).json({ error: "Query parameter 'q' is required" });
      return;
    }

    try {
      const pets = await this.searchPetsUseCase.execute({ query: q as string });
      res.status(200).json(pets.map(toPetResponseDto));
    } catch (err) {
      handleError(err, res);
    }
  }
}
