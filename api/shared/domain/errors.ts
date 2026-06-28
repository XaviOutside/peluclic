/**
 * Shared domain errors for all bounded contexts.
 *
 * Zero framework or DB imports — pure error classes usable across
 * Services, Pets, Clients, and any future bounded context.
 *
 * Controller error mapping:
 *   NotFoundError       → 404
 *   ValidationError     → 422
 *   AlreadyDeletedError → 409
 *   Any other          → 500
 */

export class NotFoundError extends Error {
  constructor(entity: string, id: number) {
    super(`${entity} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class AlreadyDeletedError extends Error {
  constructor(entity: string, id: number) {
    super(`${entity} with id ${id} is already deleted`);
    this.name = 'AlreadyDeletedError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
