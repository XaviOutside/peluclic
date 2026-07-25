import { describe, it, expect } from 'vitest';
import {
  ClientNotFoundError,
  ClientAlreadyDeletedError,
  ClientValidationError,
} from './ClientErrors';

describe('ClientNotFoundError', () => {
  it('should create an error with the correct message', () => {
    const error = new ClientNotFoundError(7);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ClientNotFoundError);
    expect(error.message).toBe('Client with id 7 not found');
    expect(error.name).toBe('ClientNotFoundError');
  });

  it('should work with any numeric id', () => {
    const error = new ClientNotFoundError(999);
    expect(error.message).toBe('Client with id 999 not found');
  });
});

describe('ClientAlreadyDeletedError', () => {
  it('should create an error with the correct message', () => {
    const error = new ClientAlreadyDeletedError(7);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ClientAlreadyDeletedError);
    expect(error.message).toBe('Client with id 7 is already deleted');
    expect(error.name).toBe('ClientAlreadyDeletedError');
  });

  it('should work with any numeric id', () => {
    const error = new ClientAlreadyDeletedError(42);
    expect(error.message).toBe('Client with id 42 is already deleted');
  });
});

describe('ClientValidationError', () => {
  it('should create an error with a custom message', () => {
    const error = new ClientValidationError('name is required');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ClientValidationError);
    expect(error.message).toBe('name is required');
    expect(error.name).toBe('ClientValidationError');
  });

  it('should accept any validation message', () => {
    const error = new ClientValidationError('email must be valid');
    expect(error.message).toBe('email must be valid');
  });
});
