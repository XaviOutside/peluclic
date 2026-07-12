/**
 * Client-side form validation utilities.
 *
 * Returns error message strings — empty string means valid.
 * Messages are i18n keys (e.g. "validation.required") that callers
 * resolve via t() or the resolveValidationMessage helper.
 *
 * Format for key+params: "key|param1=value1|param2=value2"
 */

// ReDoS-safe: character classes are disjoint, no nested quantifiers
// eslint-disable-next-line sonarjs/slow-regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

/* ------------------------------------------------------------------ */
/*  Validation key constants                                           */
/* ------------------------------------------------------------------ */

export const VALIDATION_KEYS = {
  required: 'validation.required',
  email: 'validation.email',
  phone: 'validation.phone',
  lengthTooShort: 'validation.length.tooShort',
  lengthTooShortPlural: 'validation.length.tooShortPlural',
  lengthTooLong: 'validation.length.tooLong',
  sex: 'validation.sex',
  date: 'validation.date',
  weight: 'validation.weight',
  price: 'validation.price',
  duration: 'validation.duration',
} as const;

/* ------------------------------------------------------------------ */
/*  Helper: encode key + params into a single string                   */
/* ------------------------------------------------------------------ */

/** Encode a validation key with key=value params for interpolation. */
export function encodeValidationError(key: string, params?: Record<string, string | number>): string {
  if (!params || Object.keys(params).length === 0) return key;
  const paramStr = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('|');
  return `${key}|${paramStr}`;
}

/**
 * Decode a validation error string back to key + params.
 * Used by callers in PR 2/3 to extract params for t() interpolation.
 */
export function decodeValidationError(error: string): { key: string; params?: Record<string, string | number> } {
  const parts = error.split('|');
  if (parts.length === 1) return { key: parts[0] };
  const key = parts[0];
  const params: Record<string, string | number> = {};
  for (let i = 1; i < parts.length; i++) {
    const eqIdx = parts[i].indexOf('=');
    if (eqIdx > 0) {
      params[parts[i].slice(0, eqIdx)] = decodeURIComponent(parts[i].slice(eqIdx + 1));
    }
  }
  return { key, params };
}

/* ------------------------------------------------------------------ */
/*  Atomic validators                                                  */
/* ------------------------------------------------------------------ */

/**
 * Validates that a value is non-empty after trimming.
 * Returns i18n error key or empty string.
 */
export function validateRequired(value: string, fieldName: string): string {
  if (!value || value.trim().length === 0) {
    return encodeValidationError(VALIDATION_KEYS.required, { field: fieldName });
  }
  return '';
}

/**
 * Validates an email address format.
 * Returns i18n error key or empty string if valid or empty.
 */
export function validateEmail(email: string): string {
  if (!email || email.trim().length === 0) return '';
  if (!EMAIL_REGEX.test(email.trim())) {
    return VALIDATION_KEYS.email;
  }
  return '';
}

/**
 * Validates a phone number format.
 * Returns i18n error key or empty string if valid or empty.
 */
export function validatePhone(phone: string): string {
  if (!phone || phone.trim().length === 0) return '';
  if (!PHONE_REGEX.test(phone.trim())) {
    return VALIDATION_KEYS.phone;
  }
  return '';
}

/** Field-level error map returned by composite validators. */
export interface FieldErrors {
  [field: string]: string;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  phone2: string;
  address: string;
  notes: string;
}

/**
 * Validates all fields in a client form.
 * Returns a map of field name → i18n error key.
 * Empty values mean the field is valid.
 */
export function validateClientForm(data: ClientFormData): FieldErrors {
  const errors: FieldErrors = {};

  const nameErr = validateRequired(data.name, 'Name');
  if (nameErr) errors.name = nameErr;

  const emailErr = validateRequired(data.email, 'Email');
  if (emailErr) {
    errors.email = emailErr;
  } else {
    const emailFormatErr = validateEmail(data.email);
    if (emailFormatErr) errors.email = emailFormatErr;
  }

  const phoneErr = validateRequired(data.phone, 'Phone');
  if (phoneErr) {
    errors.phone = phoneErr;
  } else {
    const phoneFormatErr = validatePhone(data.phone);
    if (phoneFormatErr) errors.phone = phoneFormatErr;
  }

  if (data.phone2) {
    const phone2FormatErr = validatePhone(data.phone2);
    if (phone2FormatErr) errors.phone2 = phone2FormatErr;
  }

  return errors;
}

export interface PetFormData {
  name: string;
  species: string;
  breed: string;
  sex: string;
  dateOfBirth: string;
  weightKg: string;
  notes: string;
  clientId: string;
}

/**
 * Validates that a string's length is within [min, max].
 * Returns i18n error key or empty string.
 */
export function validateLength(value: string, fieldName: string, min: number, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length < min) {
    const key = min === 1
      ? VALIDATION_KEYS.lengthTooShort
      : VALIDATION_KEYS.lengthTooShortPlural;
    return encodeValidationError(key, { field: fieldName, min });
  }
  if (trimmed.length > max) {
    return encodeValidationError(VALIDATION_KEYS.lengthTooLong, { field: fieldName, max });
  }
  return '';
}

/**
 * Validates all fields in a pet form.
 * Returns a map of field name → i18n error key.
 * Empty values mean the field is valid.
 */
export function validatePetForm(data: PetFormData): FieldErrors {
  const errors: FieldErrors = {};

  // Name: required, 1-100
  let err = validateRequired(data.name, 'Name');
  if (err) {
    errors.name = err;
  } else {
    err = validateLength(data.name, 'Name', 1, 100);
    if (err) errors.name = err;
  }

  // Species: required, 1-100
  err = validateRequired(data.species, 'Species');
  if (err) {
    errors.species = err;
  } else {
    err = validateLength(data.species, 'Species', 1, 100);
    if (err) errors.species = err;
  }

  // Breed: required, 1-100
  err = validateRequired(data.breed, 'Breed');
  if (err) {
    errors.breed = err;
  } else {
    err = validateLength(data.breed, 'Breed', 1, 100);
    if (err) errors.breed = err;
  }

  // Sex: must be one of known values if provided
  if (data.sex && !['unknown', 'male', 'female'].includes(data.sex)) {
    errors.sex = VALIDATION_KEYS.sex;
  }

  // Date of birth: if provided, must be a valid date
  if (data.dateOfBirth) {
    const d = new Date(data.dateOfBirth);
    if (isNaN(d.getTime())) {
      errors.dateOfBirth = VALIDATION_KEYS.date;
    }
  }

  // Weight: if provided, must be a positive number
  if (data.weightKg) {
    const w = Number(data.weightKg);
    if (isNaN(w) || w <= 0) {
      errors.weightKg = VALIDATION_KEYS.weight;
    }
  }

  // Client: required (must select a client)
  err = validateRequired(data.clientId, 'Client');
  if (err) errors.clientId = err;

  return errors;
}

export interface ServiceFormData {
  name: string;
  description: string;
  durationMinutes: string;
  price: string;
}

/**
 * Validates all fields in a service form.
 * Returns i18n error keys.
 */
export function validateServiceForm(data: ServiceFormData): FieldErrors {
  const errors: FieldErrors = {};

  // Name: required, 1-255
  let err = validateRequired(data.name, 'Name');
  if (err) {
    errors.name = err;
  } else {
    err = validateLength(data.name, 'Name', 1, 255);
    if (err) errors.name = err;
  }

  // Price: required, must be a valid non-negative dollar amount
  err = validateRequired(data.price, 'Price');
  if (err) {
    errors.price = err;
  } else {
    const priceNum = Number(data.price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.price = VALIDATION_KEYS.price;
    }
  }

  // Duration: if provided, must be a positive integer
  if (data.durationMinutes) {
    const dur = Number(data.durationMinutes);
    if (isNaN(dur) || dur <= 0 || !Number.isInteger(dur)) {
      errors.durationMinutes = VALIDATION_KEYS.duration;
    }
  }

  return errors;
}

/**
 * Returns true if a field errors map has no actual errors.
 * Fields with empty-string values are considered valid.
 */
export function isValid(errors: FieldErrors): boolean {
  return Object.values(errors).every((msg) => !msg);
}
