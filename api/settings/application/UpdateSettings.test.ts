import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSettingsUseCase } from './UpdateSettings';
import { ISettingsRepository } from '../domain/ISettingsRepository';
import { CompanySettings, UpdateSettingsInput, LANG } from '../domain/CompanySettings';
import { SettingsValidationError } from '../domain/SettingsErrors';

const defaultSettings: CompanySettings = {
  id: 1,
  companyName: 'Bark & Bubbles',
  workdays: [1, 2, 3, 4, 5],
  workStartTime: '09:00',
  workEndTime: '17:00',
  defaultLang: LANG.EN,
  createdAt: new Date('2026-07-19T00:00:00Z'),
  updatedAt: new Date('2026-07-19T00:00:00Z'),
};

const validInput: UpdateSettingsInput = {
  companyName: 'Bark & Bubbles',
  workdays: [1, 2, 3, 4, 5],
  workStartTime: '09:00',
  workEndTime: '17:00',
  defaultLang: LANG.EN,
};

function makeRepository(): ISettingsRepository {
  return {
    findSettings: vi.fn(),
    upsert: vi.fn(),
  };
}

// ─── UpdateSettingsUseCase ───────────────────────────────────────────────────

describe('UpdateSettingsUseCase', () => {
  let repository: ISettingsRepository;
  let useCase: UpdateSettingsUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new UpdateSettingsUseCase(repository);
  });

  it('upserts and returns settings for valid input', async () => {
    const updated = { ...defaultSettings, companyName: 'New Name', updatedAt: new Date() };
    vi.mocked(repository.upsert).mockResolvedValue(updated);

    const result = await useCase.execute({ ...validInput, companyName: 'New Name' });

    expect(result).toEqual(updated);
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: 'New Name' }),
    );
  });

  it('throws SettingsValidationError for empty company name', async () => {
    await expect(useCase.execute({ ...validInput, companyName: '' })).rejects.toThrow(
      SettingsValidationError,
    );
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('throws SettingsValidationError for empty workdays', async () => {
    await expect(useCase.execute({ ...validInput, workdays: [] })).rejects.toThrow(
      SettingsValidationError,
    );
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('throws SettingsValidationError for invalid workdays (out of range)', async () => {
    await expect(useCase.execute({ ...validInput, workdays: [1, 2, 8] })).rejects.toThrow(
      SettingsValidationError,
    );
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('throws SettingsValidationError for invalid time format', async () => {
    await expect(useCase.execute({ ...validInput, workStartTime: '9:00' })).rejects.toThrow(
      SettingsValidationError,
    );
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('throws SettingsValidationError when start time is after end time', async () => {
    await expect(
      useCase.execute({ ...validInput, workStartTime: '18:00', workEndTime: '09:00' }),
    ).rejects.toThrow(SettingsValidationError);
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('throws SettingsValidationError for invalid lang', async () => {
    await expect(useCase.execute({ ...validInput, defaultLang: 2 as 0 })).rejects.toThrow(
      SettingsValidationError,
    );
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('passes all fields to repository on valid upsert', async () => {
    const newInput: UpdateSettingsInput = {
      companyName: 'New Grooming Co.',
      workdays: [1, 3, 5],
      workStartTime: '08:00',
      workEndTime: '18:00',
      defaultLang: LANG.ES,
    };
    vi.mocked(repository.upsert).mockResolvedValue({ ...defaultSettings, ...newInput });

    await useCase.execute(newInput);

    expect(repository.upsert).toHaveBeenCalledWith(newInput);
  });
});
