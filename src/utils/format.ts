/**
 * Formatting utilities for display purposes.
 *
 * All display formatters accept an optional locale parameter.
 * When omitted, the active i18next language is used (via i18next.language).
 */

import type { TFunction } from 'i18next';
import type { PetSex } from '@/types/pet';

/* ------------------------------------------------------------------ */
/*  Phone                                                              */
/* ------------------------------------------------------------------ */

/**
 * Format a phone number for display. Currently passthrough;
 * the API stores various formats so we display as-is.
 */
export function formatPhone(phone: string): string {
  return phone;
}

/* ------------------------------------------------------------------ */
/*  Date                                                               */
/* ------------------------------------------------------------------ */

/**
 * Format an ISO 8601 date string to a human-readable form.
 * Returns empty string for invalid dates.
 *
 * @param dateString - ISO 8601 date string
 * @param locale - Locale code (defaults to current i18n language)
 */
export function formatDate(dateString: string, locale?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale ?? 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a service date string to DD/MM/YYYY.
 * Returns em dash (—) when the date is null, empty, or invalid.
 *
 * @param dateStr - ISO 8601 date string or null
 * @param locale - Locale code (defaults to current i18n language)
 */
export function formatServiceDate(dateStr: string | null, locale?: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  if (locale === 'en') {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${month}/${day}/${year}`;
  }
  // Spanish / default: DD/MM/YYYY
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/* ------------------------------------------------------------------ */
/*  Pet sex                                                            */
/* ------------------------------------------------------------------ */

/**
 * Format a pet sex enum value to a human-readable label.
 *
 * @param sex - PetSex enum value
 * @param t - i18next translation function (resolves `pets.sex.*`)
 */
export function formatSex(sex: PetSex, t?: TFunction): string {
  if (t) {
    switch (sex) {
      case 'male':
        return t('pets.sex.male');
      case 'female':
        return t('pets.sex.female');
      default:
        return t('pets.sex.unknown');
    }
  }
  // Fallback without t()
  switch (sex) {
    case 'male':
      return 'Male';
    case 'female':
      return 'Female';
    default:
      return 'Unknown';
  }
}

/* ------------------------------------------------------------------ */
/*  Duration                                                           */
/* ------------------------------------------------------------------ */

/**
 * Format a duration in minutes to a human-readable string.
 * Unifies the 3 duplicated versions from PetDetailCard, ServicesPage,
 * and ServiceTable.
 *
 * @param minutes - Duration in minutes (null returns fallback)
 * @param t - i18next translation function (resolves `services.format.*`)
 * @param fallback - Fallback string when minutes is null
 */
export function formatDuration(
  minutes: number | null,
  t?: TFunction,
  fallback: string = '—',
): string {
  if (minutes === null) return fallback;
  if (t) {
    return t('services.format.durationShort', { minutes });
  }
  return `${minutes} min`;
}

/**
 * Format a duration in minutes to a long-form string (e.g. "60 minutes").
 * Used by ServiceDetailCard.
 *
 * @param minutes - Duration in minutes (null returns null)
 * @param t - i18next translation function (resolves `services.format.durationMinutes`)
 */
export function formatDurationLong(
  minutes: number | null,
  t?: TFunction,
): string | null {
  if (minutes === null) return null;
  if (t) {
    return t('services.format.durationMinutes', { minutes });
  }
  return `${minutes} minutes`;
}

/* ------------------------------------------------------------------ */
/*  Weight                                                             */
/* ------------------------------------------------------------------ */

/**
 * Format a weight in kg to a display string (e.g. "12.5 kg").
 *
 * @param weightKg - Weight in kilograms (null/undefined returns null)
 * @param t - i18next translation function (resolves `pets.detail.weightUnit`)
 */
export function formatWeight(
  weightKg: number | null | undefined,
  t?: TFunction,
): string | null {
  if (weightKg === null || weightKg === undefined) return null;
  if (t) {
    return t('pets.detail.weightUnit', { weight: weightKg });
  }
  return `${weightKg} kg`;
}
