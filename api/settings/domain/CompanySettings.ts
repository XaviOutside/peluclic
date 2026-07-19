/**
 * CompanySettings domain entity — zero framework or DB imports.
 * Singleton row: the entire app has exactly one settings record.
 *
 * defaultLang is stored as TINYINT: 0 = English, 1 = Spanish.
 * workdays is an array of ISO day numbers: 1 (Monday) through 7 (Sunday).
 * Times are stored as VARCHAR(5) "HH:MM" strings.
 */

export type Lang = 0 | 1;

export const LANG = {
  EN: 0 as Lang,
  ES: 1 as Lang,
} as const;

export const LANG_LABELS: Record<Lang, string> = {
  0: 'English',
  1: 'Español',
};

export interface CompanySettings {
  id: number;
  companyName: string;
  tagline: string | null;
  workdays: number[];
  workStartTime: string;
  workEndTime: string;
  defaultLang: Lang;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSettingsInput {
  companyName: string;
  tagline: string;
  workdays: number[];
  workStartTime: string;
  workEndTime: string;
  defaultLang: Lang;
}

/* ── Validation constants ── */

export const MAX_COMPANY_NAME_LENGTH = 200;
export const MAX_TAGLINE_LENGTH = 100;
export const MAX_LOGO_SIZE = 1 * 1024 * 1024; // 1 MB
export const LOGO_PATH = 'api/uploads/logo.png';
const TIME_REGEX = /^\d{2}:\d{2}$/;

/* ── Validation functions ── */

/**
 * Validates tagline: optional, max 100 characters.
 * Returns an error message string or null if valid.
 */
export function validateTagline(tagline: unknown): string | null {
  if (tagline !== null && tagline !== undefined && tagline !== '') {
    if (typeof tagline !== 'string' || tagline.length > MAX_TAGLINE_LENGTH) {
      return `tagline must be 0–${MAX_TAGLINE_LENGTH} characters`;
    }
  }
  return null;
}

/**
 * Validates company name: required, 1–200 characters.
 * Returns an error message string or null if valid.
 */
export function validateCompanyName(name: unknown): string | null {
  if (typeof name !== 'string' || name.trim().length === 0) {
    return 'companyName must be 1–200 characters';
  }
  if (name.trim().length > MAX_COMPANY_NAME_LENGTH) {
    return 'companyName must be 1–200 characters';
  }
  return null;
}

/**
 * Validates workdays: non-empty array of integers 1–7 with no duplicates.
 * Returns an error message string or null if valid.
 */
export function validateWorkdays(workdays: unknown): string | null {
  if (!Array.isArray(workdays) || workdays.length === 0) {
    return 'workdays must contain at least one day (1–7)';
  }

  const validDays = new Set([1, 2, 3, 4, 5, 6, 7]);
  for (const day of workdays) {
    if (typeof day !== 'number' || !Number.isInteger(day) || !validDays.has(day)) {
      return 'workdays must contain at least one day (1–7)';
    }
  }

  return null;
}

/**
 * Validates a time string in HH:MM format (00–23 for hours, 00–59 for minutes).
 * Returns an error message string or null if valid.
 */
export function validateTimeFormat(time: unknown, fieldName: string): string | null {
  if (typeof time !== 'string' || !TIME_REGEX.test(time)) {
    return `${fieldName} must be in HH:MM format`;
  }

  const [hours, minutes] = time.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return `${fieldName} must be in HH:MM format`;
  }

  return null;
}

/**
 * Validates that workStartTime is before workEndTime.
 * Both must be valid HH:MM format before calling this.
 * Returns an error message string or null if valid.
 */
export function validateTimeRange(start: string, end: string): string | null {
  if (start >= end) {
    return 'workStartTime must be before workEndTime';
  }
  return null;
}

/**
 * Validates defaultLang: must be 0 or 1.
 * Returns an error message string or null if valid.
 */
export function validateLang(lang: unknown): string | null {
  if (lang !== 0 && lang !== 1) {
    return 'defaultLang must be 0 (English) or 1 (Spanish)';
  }
  return null;
}

/**
 * Runs all validation rules for an UpdateSettingsInput and returns
 * an array of error messages. Empty array means valid.
 */
export function validateUpdateInput(input: UpdateSettingsInput): string[] {
  const errors: string[] = [];

  const nameError = validateCompanyName(input.companyName);
  if (nameError) errors.push(nameError);

  const taglineError = validateTagline(input.tagline);
  if (taglineError) errors.push(taglineError);

  const workdaysError = validateWorkdays(input.workdays);
  if (workdaysError) errors.push(workdaysError);

  const startError = validateTimeFormat(input.workStartTime, 'workStartTime');
  if (startError) errors.push(startError);

  const endError = validateTimeFormat(input.workEndTime, 'workEndTime');
  if (endError) errors.push(endError);

  // Only check range if both times are valid format
  if (!startError && !endError) {
    const rangeError = validateTimeRange(input.workStartTime, input.workEndTime);
    if (rangeError) errors.push(rangeError);
  }

  const langError = validateLang(input.defaultLang);
  if (langError) errors.push(langError);

  return errors;
}
