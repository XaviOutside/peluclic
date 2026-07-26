import type { CompanySettings } from '../../domain/CompanySettings';

/**
 * Response DTO for the singleton settings resource.
 * - workdays is an array of day numbers (1–7).
 * - times are HH:MM strings.
 * - defaultLang is the raw TINYINT (0=en, 1=es) — the frontend maps it.
 * - tagline is optional company subtitle.
 * - logoUrl is included only when a logo has been uploaded (logoFilename is set).
 * - createdAt / updatedAt are ISO 8601 strings.
 */
export interface SettingsResponseDto {
  id: number;
  companyName: string;
  tagline: string | null;
  workdays: number[];
  workStartTime: string;
  workEndTime: string;
  defaultLang: 0 | 1;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Maps a domain CompanySettings entity to a SettingsResponseDto.
 * Includes logoUrl when logoFilename is set on the settings row.
 */
export function toSettingsResponseDto(settings: CompanySettings): SettingsResponseDto {
  const logoUrl = settings.logoFilename
    ? `/api/v1/settings/logo`
    : null;

  return {
    id: settings.id,
    companyName: settings.companyName,
    tagline: settings.tagline,
    workdays: settings.workdays,
    workStartTime: settings.workStartTime,
    workEndTime: settings.workEndTime,
    defaultLang: settings.defaultLang,
    logoUrl,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
}
