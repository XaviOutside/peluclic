import { describe, it, expect } from 'vitest';
import {
  PetNotFoundError,
  PetAlreadyDeletedError,
  PetValidationError,
} from './PetErrors';

describe('PetNotFoundError', () => {
  it('should create an error with the correct message', () => {
    const error = new PetNotFoundError(7);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PetNotFoundError);
    expect(error.message).toBe('Pet with id 7 not found');
    expect(error.name).toBe('PetNotFoundError');
  });

  it('should work with any numeric id', () => {
    const error = new PetNotFoundError(999);
    expect(error.message).toBe('Pet with id 999 not found');
  });
});

describe('PetAlreadyDeletedError', () => {
  it('should create an error with the correct message', () => {
    const error = new PetAlreadyDeletedError(7);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PetAlreadyDeletedError);
    expect(error.message).toBe('Pet with id 7 is already deleted');
    expect(error.name).toBe('PetAlreadyDeletedError');
  });

  it('should work with any numeric id', () => {
    const error = new PetAlreadyDeletedError(42);
    expect(error.message).toBe('Pet with id 42 is already deleted');
  });
});

describe('PetValidationError', () => {
  it('should create an error with a custom message', () => {
    const error = new PetValidationError('name is required');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PetValidationError);
    expect(error.message).toBe('name is required');
    expect(error.name).toBe('PetValidationError');
  });

  it('should accept any validation message', () => {
    const error = new PetValidationError('client_id references a deleted client');
    expect(error.message).toBe('client_id references a deleted client');
  });
});
