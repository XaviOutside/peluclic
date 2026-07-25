import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEs from '@/locales/es/common.json';
import clientsEs from '@/locales/es/clients.json';
import petsEs from '@/locales/es/pets.json';
import servicesEs from '@/locales/es/services.json';
import landingEs from '@/locales/es/landing.json';
import validationEs from '@/locales/es/validation.json';
import settingsEs from '@/locales/es/settings.json';
import appointmentsEs from '@/locales/es/appointments.json';
import loginEs from '@/locales/es/login.json';

import commonEn from '@/locales/en/common.json';
import clientsEn from '@/locales/en/clients.json';
import petsEn from '@/locales/en/pets.json';
import servicesEn from '@/locales/en/services.json';
import landingEn from '@/locales/en/landing.json';
import validationEn from '@/locales/en/validation.json';
import settingsEn from '@/locales/en/settings.json';
import appointmentsEn from '@/locales/en/appointments.json';
import loginEn from '@/locales/en/login.json';

import { LANG_MAP } from '@/types/settings';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: commonEs,
        clients: clientsEs,
        pets: petsEs,
        services: servicesEs,
        landing: landingEs,
        validation: validationEs,
        settings: settingsEs,
        appointments: appointmentsEs,
        login: loginEs,
      },
      en: {
        common: commonEn,
        clients: clientsEn,
        pets: petsEn,
        services: servicesEn,
        landing: landingEn,
        validation: validationEn,
        settings: settingsEn,
        appointments: appointmentsEn,
        login: loginEn,
      },
    },
    fallbackLng: 'en',
    supportedLngs: ['es', 'en'],
    detection: {
      order: ['navigator'],
      caches: [],
    },
    interpolation: {
      escapeValue: false,
    },
    returnObjects: false,
  });

// Sync <html lang> attribute
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

// Set initial lang attribute
document.documentElement.lang = i18n.language;

/**
 * Fetch company settings and apply the stored defaultLang
 * before the first render. Uses raw fetch() to avoid depending
 * on the storage layer (which requires React to be mounted).
 *
 * Falls back to navigator detection on failure.
 *
 * Call this in main.tsx BEFORE ReactDOM.createRoot().
 */
export async function initializeLanguage(): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/v1/settings', { headers });
    if (!res.ok) throw new Error(`Settings API returned ${res.status}`);

    const settings = await res.json();
    const lang = LANG_MAP[settings.defaultLang as 0 | 1];
    if (lang && lang !== i18n.language) {
      await i18n.changeLanguage(lang);
    }
  } catch {
    // Navigator fallback as configured via LanguageDetector
  }
}

export default i18n;
