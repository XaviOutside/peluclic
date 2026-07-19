/**
 * Request DTO for updating company settings.
 * All fields are required — this is a PUT with a full replacement payload.
 */
export interface UpdateSettingsDto {
  companyName: string;
  tagline?: string | null;
  workdays: number[];
  workStartTime: string;
  workEndTime: string;
  defaultLang: 0 | 1;
}
