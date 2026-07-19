import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSettingsUseCase } from './GetSettings';
import { ISettingsRepository } from '../domain/ISettingsRepository';
import { CompanySettings, LANG } from '../domain/CompanySettings';
import { SettingsNotFoundError } from '../domain/SettingsErrors';

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

function makeRepository(): ISettingsRepository {
  return {
    findSettings: vi.fn(),
    upsert: vi.fn(),
  };
}

// ─── GetSettingsUseCase ──────────────────────────────────────────────────────

describe('GetSettingsUseCase', () => {
  let repository: ISettingsRepository;
  let useCase: GetSettingsUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new GetSettingsUseCase(repository);
  });

  it('returns settings when found', async () => {
    vi.mocked(repository.findSettings).mockResolvedValue(defaultSettings);

    const result = await useCase.execute();

    expect(result).toEqual(defaultSettings);
    expect(repository.findSettings).toHaveBeenCalledOnce();
  });

  it('throws SettingsNotFoundError when no settings row exists', async () => {
    vi.mocked(repository.findSettings).mockResolvedValue(null);

    await expect(useCase.execute()).rejects.toThrow(SettingsNotFoundError);
    await expect(useCase.execute()).rejects.toThrow('Company settings not found');
  });
});
