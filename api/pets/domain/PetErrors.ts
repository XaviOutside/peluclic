/**
 * Domain errors for the pets bounded context.
 * These are pure error classes — no framework or DB imports.
 */

export class PetNotFoundError extends Error {
  constructor(id: number) {
    super(`Pet with id ${id} not found`);
    this.name = 'PetNotFoundError';
  }
}

export class PetAlreadyDeletedError extends Error {
  constructor(id: number) {
    super(`Pet with id ${id} is already deleted`);
    this.name = 'PetAlreadyDeletedError';
  }
}

export class PetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PetValidationError';
  }
}
