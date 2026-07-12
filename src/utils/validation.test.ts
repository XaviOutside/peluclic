import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validateClientForm,
  isValid,
  encodeValidationError,
  VALIDATION_KEYS,
} from './validation';

describe('validateRequired', () => {
  it('returns error for empty string', () => {
    expect(validateRequired('', 'Name')).toBe(
      encodeValidationError(VALIDATION_KEYS.required, { field: 'Name' }),
    );
  });

  it('returns error for whitespace-only string', () => {
    expect(validateRequired('   ', 'Name')).toBe(
      encodeValidationError(VALIDATION_KEYS.required, { field: 'Name' }),
    );
  });

  it('returns empty string for valid value', () => {
    expect(validateRequired('John', 'Name')).toBe('');
  });
});

describe('validateEmail', () => {
  it('returns empty for empty input', () => {
    expect(validateEmail('')).toBe('');
  });

  it('returns error for invalid email', () => {
    expect(validateEmail('not-an-email')).toBe(VALIDATION_KEYS.email);
  });

  it('returns empty for valid email', () => {
    expect(validateEmail('test@example.com')).toBe('');
  });

  it('returns empty for valid email with subdomain', () => {
    expect(validateEmail('user@sub.example.com')).toBe('');
  });
});

describe('validatePhone', () => {
  it('returns empty for empty input', () => {
    expect(validatePhone('')).toBe('');
  });

  it('returns empty for valid US phone format', () => {
    expect(validatePhone('+1 (555) 123-4567')).toBe('');
  });

  it('returns empty for simple digits', () => {
    expect(validatePhone('5551234567')).toBe('');
  });

  it('returns error for too-short input', () => {
    expect(validatePhone('12')).toBe(VALIDATION_KEYS.phone);
  });
});

describe('validateClientForm', () => {
  it('returns errors for empty required fields', () => {
    const errors = validateClientForm({
      name: '',
      email: '',
      phone: '',
      phone2: '',
      address: '',
    });
    expect(errors.name).toBe(
      encodeValidationError(VALIDATION_KEYS.required, { field: 'Name' }),
    );
    expect(errors.email).toBe(
      encodeValidationError(VALIDATION_KEYS.required, { field: 'Email' }),
    );
    expect(errors.phone).toBe(
      encodeValidationError(VALIDATION_KEYS.required, { field: 'Phone' }),
    );
    expect(errors.phone2).toBeUndefined();
  });

  it('returns email format error when email is invalid', () => {
    const errors = validateClientForm({
      name: 'John',
      email: 'bad',
      phone: '+1 (555) 123-4567',
      phone2: '',
      address: '',
    });
    expect(errors.email).toBe(VALIDATION_KEYS.email);
  });

  it('returns no errors for valid data', () => {
    const errors = validateClientForm({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      phone2: '',
      address: '123 Main St',
    });
    expect(isValid(errors)).toBe(true);
  });

  it('validates phone2 format when provided', () => {
    const errors = validateClientForm({
      name: 'John',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      phone2: 'bad',
      address: '',
    });
    expect(errors.phone2).toBe(VALIDATION_KEYS.phone);
  });
});

describe('isValid', () => {
  it('returns true for empty errors object', () => {
    expect(isValid({})).toBe(true);
  });

  it('returns true when all errors are empty strings', () => {
    expect(isValid({ name: '', email: '' })).toBe(true);
  });

  it('returns false when any error has a message', () => {
    expect(isValid({
      name: encodeValidationError(VALIDATION_KEYS.required, { field: 'Name' }),
      email: '',
    })).toBe(false);
  });
});
