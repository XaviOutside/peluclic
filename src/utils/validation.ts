/**
 * Client-side form validation utilities.
 * Returns error message strings — empty string means valid.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

/**
 * Validates that a value is non-empty after trimming.
 * Returns error message or empty string.
 */
export function validateRequired(value: string, fieldName: string): string {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return '';
}

/**
 * Validates an email address format.
 * Returns error message or empty string if valid or empty.
 */
export function validateEmail(email: string): string {
  if (!email || email.trim().length === 0) return '';
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return '';
}

/**
 * Validates a phone number format.
 * Returns error message or empty string if valid or empty.
 */
export function validatePhone(phone: string): string {
  if (!phone || phone.trim().length === 0) return '';
  if (!PHONE_REGEX.test(phone.trim())) {
    return 'Please enter a valid phone number';
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
}

/**
 * Validates all fields in a client form.
 * Returns a map of field name → error message.
 * Empty error messages mean the field is valid.
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
 * Returns error message or empty string.
 */
export function validateLength(value: string, fieldName: string, min: number, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length < min) {
    return `${fieldName} must be at least ${min} character${min === 1 ? '' : 's'}`;
  }
  if (trimmed.length > max) {
    return `${fieldName} must be at most ${max} characters`;
  }
  return '';
}

/**
 * Validates all fields in a pet form.
 * Returns a map of field name → error message.
 * Empty error messages mean the field is valid.
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
    errors.sex = 'Sex must be Unknown, Male, or Female';
  }

  // Date of birth: if provided, must be a valid date
  if (data.dateOfBirth) {
    const d = new Date(data.dateOfBirth);
    if (isNaN(d.getTime())) {
      errors.dateOfBirth = 'Please enter a valid date';
    }
  }

  // Weight: if provided, must be a positive number
  if (data.weightKg) {
    const w = Number(data.weightKg);
    if (isNaN(w) || w <= 0) {
      errors.weightKg = 'Weight must be a positive number';
    }
  }

  // Client: required (must select a client)
  err = validateRequired(data.clientId, 'Client');
  if (err) errors.clientId = err;

  return errors;
}

/**
 * Returns true if a field errors map has no actual errors.
 * Fields with empty-string values are considered valid.
 */
export function isValid(errors: FieldErrors): boolean {
  return Object.values(errors).every((msg) => !msg);
}
