import { describe, it, expect } from 'vitest';
import enLanding from '@/locales/en/landing.json';
import esLanding from '@/locales/es/landing.json';

describe('Privacy i18n — GDPR transparency sections', () => {
  it('has privacy.sections as a non-empty array in English', () => {
    const sections = (enLanding as Record<string, unknown>).privacy as Record<string, unknown>;
    expect(sections).toBeDefined();
    expect(sections.sections).toBeDefined();
    expect(Array.isArray(sections.sections)).toBe(true);
    const arr = sections.sections as Array<unknown>;
    expect(arr.length).toBeGreaterThanOrEqual(10);
  });

  it('has privacy.sections as a non-empty array in Spanish', () => {
    const sections = (esLanding as Record<string, unknown>).privacy as Record<string, unknown>;
    expect(sections).toBeDefined();
    expect(sections.sections).toBeDefined();
    expect(Array.isArray(sections.sections)).toBe(true);
    const arr = sections.sections as Array<unknown>;
    expect(arr.length).toBeGreaterThanOrEqual(10);
  });

  it('each English section has title and content strings', () => {
    const sections = (enLanding as Record<string, unknown>).privacy as Record<string, unknown>;
    const arr = sections.sections as Array<Record<string, unknown>>;
    for (const section of arr) {
      expect(typeof section.title).toBe('string');
      expect(typeof section.content).toBe('string');
      expect((section.title as string).length).toBeGreaterThan(0);
      expect((section.content as string).length).toBeGreaterThan(0);
    }
  });

  it('each Spanish section has title and content strings', () => {
    const sections = (esLanding as Record<string, unknown>).privacy as Record<string, unknown>;
    const arr = sections.sections as Array<Record<string, unknown>>;
    for (const section of arr) {
      expect(typeof section.title).toBe('string');
      expect(typeof section.content).toBe('string');
      expect((section.title as string).length).toBeGreaterThan(0);
      expect((section.content as string).length).toBeGreaterThan(0);
    }
  });

  it('DPA section exists in English and Spanish', () => {
    const enPrivacy = (enLanding as Record<string, unknown>).privacy as Record<string, unknown>;
    const esPrivacy = (esLanding as Record<string, unknown>).privacy as Record<string, unknown>;

    const enArr = enPrivacy.sections as Array<Record<string, unknown>>;
    const esArr = esPrivacy.sections as Array<Record<string, unknown>>;

    const enDPA = enArr.find((s) => (s.title as string).toLowerCase().includes('dpa') || (s.title as string).toLowerCase().includes('processing'));
    const esDPA = esArr.find((s) => (s.title as string).toLowerCase().includes('dpa') || (s.title as string).toLowerCase().includes('encargo') || (s.title as string).toLowerCase().includes('tratamiento'));

    expect(enDPA).toBeDefined();
    expect(esDPA).toBeDefined();
  });
});
