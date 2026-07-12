import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEs from '@/locales/es/common.json';
import clientsEs from '@/locales/es/clients.json';
import petsEs from '@/locales/es/pets.json';
import servicesEs from '@/locales/es/services.json';
import landingEs from '@/locales/es/landing.json';
import validationEs from '@/locales/es/validation.json';

import commonEn from '@/locales/en/common.json';
import clientsEn from '@/locales/en/clients.json';
import petsEn from '@/locales/en/pets.json';
import servicesEn from '@/locales/en/services.json';
import landingEn from '@/locales/en/landing.json';
import validationEn from '@/locales/en/validation.json';

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
      },
      en: {
        common: commonEn,
        clients: clientsEn,
        pets: petsEn,
        services: servicesEn,
        landing: landingEn,
        validation: validationEn,
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

export default i18n;
