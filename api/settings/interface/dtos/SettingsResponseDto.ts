import { CompanySettings } from '../../domain/CompanySettings';
import { existsSync, statSync } from 'fs';
import { LOGO_PATH } from '../../domain/CompanySettings';

/**
 * Response DTO for the singleton settings resource.
 * - workdays is an array of day numbers (1–7).
 * - times are HH:MM strings.
 * - defaultLang is the raw TINYINT (0=en, 1=es) — the frontend maps it.
 * - tagline is optional company subtitle.
 * - logoUrl is included only when a logo file exists on disk.
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
 * Includes logoUrl when the file exists on disk.
 */
export function toSettingsResponseDto(settings: CompanySettings): SettingsResponseDto {
  let logoUrl: string | null = null;
  try {
    if (existsSync(LOGO_PATH)) {
      // Append file size as cache-buster query param
      const size = statSync(LOGO_PATH).size;
      logoUrl = `/api/v1/settings/logo?cb=${size}`;
    }
  } catch {
    // File missing or unreadable — omit logoUrl
  }

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
