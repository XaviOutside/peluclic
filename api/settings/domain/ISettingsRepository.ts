/**
 * Repository interface for the settings bounded context.
 * Domain types only — no Prisma, no Express, no framework imports.
 */
import { CompanySettings, UpdateSettingsInput } from './CompanySettings';

export interface ISettingsRepository {
  /** Returns the singleton settings row or null if none exists. */
  findSettings(): Promise<CompanySettings | null>;

  /** Upserts the singleton settings row: findFirst → update or create. */
  upsert(data: UpdateSettingsInput): Promise<CompanySettings>;
}
