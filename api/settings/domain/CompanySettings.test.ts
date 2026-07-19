import { describe, it, expect } from 'vitest';
import {
  validateCompanyName,
  validateWorkdays,
  validateTimeFormat,
  validateTimeRange,
  validateLang,
  validateUpdateInput,
  LANG,
  MAX_COMPANY_NAME_LENGTH,
} from '../domain/CompanySettings';
import type { UpdateSettingsInput } from '../domain/CompanySettings';

// ─── validateCompanyName ─────────────────────────────────────────────────────

describe('validateCompanyName', () => {
  it('returns null for a valid name', () => {
    expect(validateCompanyName('Bark & Bubbles')).toBeNull();
  });

  it('returns null for a name at the max length boundary', () => {
    const name = 'A'.repeat(MAX_COMPANY_NAME_LENGTH);
    expect(validateCompanyName(name)).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(validateCompanyName('')).toBe('companyName must be 1–200 characters');
  });

  it('returns error for whitespace-only string', () => {
    expect(validateCompanyName('   ')).toBe('companyName must be 1–200 characters');
  });

  it('returns error for non-string', () => {
    expect(validateCompanyName(123)).toBe('companyName must be 1–200 characters');
    expect(validateCompanyName(null)).toBe('companyName must be 1–200 characters');
    expect(validateCompanyName(undefined)).toBe('companyName must be 1–200 characters');
  });

  it('returns error for name exceeding max length', () => {
    const name = 'A'.repeat(MAX_COMPANY_NAME_LENGTH + 1);
    expect(validateCompanyName(name)).toBe('companyName must be 1–200 characters');
  });
});

// ─── validateWorkdays ────────────────────────────────────────────────────────

describe('validateWorkdays', () => {
  it('returns null for valid workdays', () => {
    expect(validateWorkdays([1, 2, 3, 4, 5])).toBeNull();
    expect(validateWorkdays([1])).toBeNull();
    expect(validateWorkdays([7])).toBeNull();
  });

  it('returns error for empty array', () => {
    expect(validateWorkdays([])).toBe('workdays must contain at least one day (1–7)');
  });

  it('returns error for non-array', () => {
    expect(validateWorkdays('1,2,3')).toBe('workdays must contain at least one day (1–7)');
    expect(validateWorkdays(null)).toBe('workdays must contain at least one day (1–7)');
  });

  it('returns error for array with non-integer elements', () => {
    expect(validateWorkdays([1, '2', 3])).toBe('workdays must contain at least one day (1–7)');
    expect(validateWorkdays([1.5, 2])).toBe('workdays must contain at least one day (1–7)');
  });

  it('returns error for array with out-of-range numbers', () => {
    expect(validateWorkdays([0, 1, 2])).toBe('workdays must contain at least one day (1–7)');
    expect(validateWorkdays([1, 2, 8])).toBe('workdays must contain at least one day (1–7)');
    expect(validateWorkdays([-1])).toBe('workdays must contain at least one day (1–7)');
  });
});

// ─── validateTimeFormat ──────────────────────────────────────────────────────

describe('validateTimeFormat', () => {
  it('returns null for valid HH:MM', () => {
    expect(validateTimeFormat('09:00', 'workStartTime')).toBeNull();
    expect(validateTimeFormat('00:00', 'workStartTime')).toBeNull();
    expect(validateTimeFormat('23:59', 'workEndTime')).toBeNull();
  });

  it('returns error for invalid format', () => {
    expect(validateTimeFormat('9:00', 'workStartTime')).toBe('workStartTime must be in HH:MM format');
    expect(validateTimeFormat('09:0', 'workStartTime')).toBe('workStartTime must be in HH:MM format');
    expect(validateTimeFormat('abc', 'workStartTime')).toBe('workStartTime must be in HH:MM format');
    expect(validateTimeFormat('', 'workStartTime')).toBe('workStartTime must be in HH:MM format');
  });

  it('returns error for hours out of range', () => {
    expect(validateTimeFormat('24:00', 'workStartTime')).toBe('workStartTime must be in HH:MM format');
    expect(validateTimeFormat('99:00', 'workStartTime')).toBe('workStartTime must be in HH:MM format');
  });

  it('returns error for minutes out of range', () => {
    expect(validateTimeFormat('09:60', 'workStartTime')).toBe('workStartTime must be in HH:MM format');
    expect(validateTimeFormat('09:99', 'workStartTime')).toBe('workStartTime must be in HH:MM format');
  });

  it('returns error for non-string', () => {
    expect(validateTimeFormat(900, 'workStartTime')).toBe('workStartTime must be in HH:MM format');
    expect(validateTimeFormat(null, 'workStartTime')).toBe('workStartTime must be in HH:MM format');
  });
});

// ─── validateTimeRange ───────────────────────────────────────────────────────

describe('validateTimeRange', () => {
  it('returns null when start is before end', () => {
    expect(validateTimeRange('09:00', '17:00')).toBeNull();
  });

  it('returns error when start equals end', () => {
    expect(validateTimeRange('09:00', '09:00')).toBe('workStartTime must be before workEndTime');
  });

  it('returns error when start is after end', () => {
    expect(validateTimeRange('17:00', '09:00')).toBe('workStartTime must be before workEndTime');
  });
});

// ─── validateLang ────────────────────────────────────────────────────────────

describe('validateLang', () => {
  it('returns null for valid lang values', () => {
    expect(validateLang(LANG.EN)).toBeNull();
    expect(validateLang(LANG.ES)).toBeNull();
    expect(validateLang(0)).toBeNull();
    expect(validateLang(1)).toBeNull();
  });

  it('returns error for invalid values', () => {
    expect(validateLang(2)).toBe('defaultLang must be 0 (English) or 1 (Spanish)');
    expect(validateLang(-1)).toBe('defaultLang must be 0 (English) or 1 (Spanish)');
    expect(validateLang('en')).toBe('defaultLang must be 0 (English) or 1 (Spanish)');
    expect(validateLang(null)).toBe('defaultLang must be 0 (English) or 1 (Spanish)');
    expect(validateLang(undefined)).toBe('defaultLang must be 0 (English) or 1 (Spanish)');
  });
});

// ─── validateUpdateInput ─────────────────────────────────────────────────────

describe('validateUpdateInput', () => {
  const validInput: UpdateSettingsInput = {
    companyName: 'Bark & Bubbles',
    workdays: [1, 2, 3, 4, 5],
    workStartTime: '09:00',
    workEndTime: '17:00',
    defaultLang: LANG.EN,
  };

  it('returns empty array for valid input', () => {
    expect(validateUpdateInput(validInput)).toEqual([]);
  });

  it('returns companyName error', () => {
    const result = validateUpdateInput({ ...validInput, companyName: '' });
    expect(result).toContain('companyName must be 1–200 characters');
  });

  it('returns workdays error', () => {
    const result = validateUpdateInput({ ...validInput, workdays: [] });
    expect(result).toContain('workdays must contain at least one day (1–7)');
  });

  it('returns workStartTime format error', () => {
    const result = validateUpdateInput({ ...validInput, workStartTime: '9:00' });
    expect(result).toContain('workStartTime must be in HH:MM format');
  });

  it('returns workEndTime format error', () => {
    const result = validateUpdateInput({ ...validInput, workEndTime: 'bad' });
    expect(result).toContain('workEndTime must be in HH:MM format');
  });

  it('returns time range error when start is after end', () => {
    const result = validateUpdateInput({ ...validInput, workStartTime: '18:00', workEndTime: '09:00' });
    expect(result).toContain('workStartTime must be before workEndTime');
  });

  it('does NOT return time range error when one time is malformed', () => {
    // Range check is skipped if either time fails format validation
    const result = validateUpdateInput({ ...validInput, workStartTime: 'bad', workEndTime: '09:00' });
    expect(result.some((e) => e.includes('before'))).toBe(false);
    expect(result).toContain('workStartTime must be in HH:MM format');
  });

  it('returns lang error', () => {
    const result = validateUpdateInput({ ...validInput, defaultLang: 2 as 0 });
    expect(result).toContain('defaultLang must be 0 (English) or 1 (Spanish)');
  });

  it('returns multiple errors at once', () => {
    const result = validateUpdateInput({
      companyName: '',
      workdays: [],
      workStartTime: 'bad',
      workEndTime: 'bad',
      defaultLang: 99 as 0,
    });
    expect(result.length).toBeGreaterThanOrEqual(4);
  });
});
