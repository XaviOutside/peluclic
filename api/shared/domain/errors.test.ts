/**
 * Tests for shared domain errors.
 *
 * Verifies:
 * - NotFoundError message format
 * - ValidationError message format
 * - AlreadyDeletedError message format
 * - instanceof checks
 */
import { describe, it, expect } from 'vitest';
import { NotFoundError, ValidationError, AlreadyDeletedError } from './errors';

describe('NotFoundError', () => {
  it('formats the message with entity name and id', () => {
    const err = new NotFoundError('Service', 42);
    expect(err.message).toBe('Service with id 42 not found');
    expect(err.name).toBe('NotFoundError');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(NotFoundError);
  });

  it('works with any entity name and id', () => {
    const err = new NotFoundError('Pet', 999);
    expect(err.message).toBe('Pet with id 999 not found');
  });
});

describe('ValidationError', () => {
  it('uses the provided message string', () => {
    const err = new ValidationError('Name is required');
    expect(err.message).toBe('Name is required');
    expect(err.name).toBe('ValidationError');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('works with any message', () => {
    const err = new ValidationError('Price must be non-negative');
    expect(err.message).toBe('Price must be non-negative');
  });
});

describe('AlreadyDeletedError', () => {
  it('formats the message with entity name and id', () => {
    const err = new AlreadyDeletedError('Service', 5);
    expect(err.message).toBe('Service with id 5 is already deleted');
    expect(err.name).toBe('AlreadyDeletedError');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AlreadyDeletedError);
  });

  it('works with any entity name and id', () => {
    const err = new AlreadyDeletedError('Client', 7);
    expect(err.message).toBe('Client with id 7 is already deleted');
  });
});
