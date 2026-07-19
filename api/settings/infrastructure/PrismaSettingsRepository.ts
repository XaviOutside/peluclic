import { prisma } from '@api/shared/infrastructure/prisma';
import { CompanySettings, UpdateSettingsInput } from '../domain/CompanySettings';
import { ISettingsRepository } from '../domain/ISettingsRepository';

/**
 * Prisma implementation of ISettingsRepository.
 *
 * Singleton pattern: findSettings() uses findFirst() without a where clause.
 * upsert() implements a manual upsert: findFirst → update or create.
 * Prisma model results are mapped to domain CompanySettings type (camelCase, Date objects).
 * No domain errors thrown here — caller (use cases / controller) handles error mapping.
 */
export class PrismaSettingsRepository implements ISettingsRepository {
  async findSettings(): Promise<CompanySettings | null> {
    const row = await prisma.companySettings.findFirst();

    if (!row) return null;

    return this.mapToSettings(row);
  }

  async upsert(data: UpdateSettingsInput): Promise<CompanySettings> {
    const existing = await prisma.companySettings.findFirst();

    if (existing) {
      const updated = await prisma.companySettings.update({
        where: { id: existing.id },
        data: {
          companyName: data.companyName,
          tagline: data.tagline || null,
          workdays: data.workdays,
          workStartTime: data.workStartTime,
          workEndTime: data.workEndTime,
          defaultLang: data.defaultLang,
        },
      });
      return this.mapToSettings(updated);
    }

    const created = await prisma.companySettings.create({
      data: {
        companyName: data.companyName,
        tagline: data.tagline || null,
        workdays: data.workdays,
        workStartTime: data.workStartTime,
        workEndTime: data.workEndTime,
        defaultLang: data.defaultLang,
      },
    });
    return this.mapToSettings(created);
  }

  /**
   * Maps a Prisma CompanySettings model row to the domain CompanySettings type.
   * Parses the JSON workdays column into a number[].
   */
  private mapToSettings(row: {
    id: number;
    companyName: string;
    tagline: string | null;
    workdays: unknown;
    workStartTime: string;
    workEndTime: string;
    defaultLang: number;
    createdAt: Date;
    updatedAt: Date;
  }): CompanySettings {
    return {
      id: row.id,
      companyName: row.companyName,
      tagline: row.tagline,
      workdays: this.parseWorkdays(row.workdays),
      workStartTime: row.workStartTime,
      workEndTime: row.workEndTime,
      defaultLang: row.defaultLang as 0 | 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private parseWorkdays(raw: unknown): number[] {
    if (Array.isArray(raw)) {
      return raw.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 7);
    }
    return [];
  }
}
