import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStorageMode } from '@/storage/useStorageMode';
import LanguageSwitcher from '@/components/molecules/LanguageSwitcher';

/* ═══════════════════════════════════════════════════════════════════════════
   SVG Icons — equivalents to Material Symbols in the HTML
   ═══════════════════════════════════════════════════════════════════════════ */

type IconSize = 'sm' | 'md' | 'lg';

function sizeClass(size: IconSize, classes: Record<IconSize, string>): string {
  return classes[size];
}

const PetsIcon = ({ size = 'md' }: { size?: IconSize }) => (
  <svg className={sizeClass(size, { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-9 w-9' })} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 2c-2.5 0-4.5 1.2-5.8 3C8.8 3.2 6.8 2 4 2 2 2 0 4 0 6.5 0 13 6 22 16 30 26 22 32 13 32 6.5 32 4 30 2 28 2c-2.8 0-4.8 1.2-6.2 3C20.5 3.2 18.5 2 16 2z" /></svg>
);

const CalendarIcon = ({ size = 'md' }: { size?: IconSize }) => (
  <svg className={sizeClass(size, { sm: 'h-5 w-5', md: 'h-6 w-6', lg: 'h-9 w-9' })} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);

const GroupIcon = ({ size = 'md' }: { size?: IconSize }) => (
  <svg className={sizeClass(size, { sm: 'h-5 w-5', md: 'h-6 w-6', lg: 'h-9 w-9' })} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);

const CutIcon = ({ size = 'md' }: { size?: IconSize }) => (
  <svg className={sizeClass(size, { sm: 'h-5 w-5', md: 'h-6 w-6', lg: 'h-9 w-9' })} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>
);

const HERO_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP-2mYS7jEBiaj96KxUzIEoVrDgBH7ztDf1MC8dzTuE96cNVVrENH_iCSrjDJpKi1jGO4opzISofyKXyV7ugm0S7ubPvbRPBx_ZZK_NT1B03uV1UwH56LafVJD9CL4unewK9c0nuSe6B1dQYpsEBy9B5SArfRvP-65qp6hsrk0WSzbKCQ_NlU7msqVJsuKrVeqvPNm8e6jB4cqnSpWaE1dTtc1mnFL3STBfxW7uCCfAa6UtoBT36ame0NharO-z7K24ibIeOPxYu8';

/* ═══════════════════════════════════════════════════════════════════════════
   Landing Page — demo mode entry point
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { t } = useTranslation('landing');
  const { setMode } = useStorageMode();

  function handleTryDemo() {
    setMode('demo');
    window.location.href = '/clients';
  }

  function handleTryApi() {
    setMode('api');
    window.location.href = '/clients';
  }

  return (
    <>
      {/* ── Hero Section ── */}
      <section className="relative mx-auto max-w-[--container-max] px-[--spacing-margin-mobile] py-12 md:grid md:grid-cols-2 md:items-center md:gap-12 md:px-[--spacing-margin-desktop] md:py-24">
        <LanguageSwitcher
          className="absolute top-4 right-4 z-10 w-auto rounded-full px-3 py-1.5 text-sm"
        />
        <div className="space-y-6">
          <h1 className="text-headline-xl-mobile text-on-surface md:text-headline-xl">
            {t('hero.title')}
          </h1>
          <p className="max-w-lg text-body-lg text-on-surface-variant">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <button
              onClick={handleTryDemo}
              className="inline-flex w-full items-center justify-center rounded-full bg-primary-container px-8 py-3 text-label-md font-semibold text-on-primary-container transition-colors hover:bg-surface-tint sm:w-auto"
              type="button"
            >
              {t('hero.cta')}
            </button>
            <button
              onClick={handleTryApi}
              className="inline-flex w-full items-center justify-center rounded-full bg-secondary-container px-8 py-3 text-label-md font-semibold text-on-secondary-container transition-colors hover:bg-secondary-fixed sm:w-auto"
              type="button"
            >
              {t('hero.demo')}
            </button>
          </div>
        </div>
        <div className="relative mt-8 h-[400px] overflow-hidden rounded-2xl shadow-xl shadow-primary-container/20 md:mt-0 md:h-[500px]">
          <img
            className="absolute inset-0 h-full w-full rounded-2xl object-cover"
            alt="A modern, bright dog grooming salon interior with clean white walls and subtle teal accents. A happy, fluffy white poodle is standing on a grooming table, looking at the camera."
            src={HERO_IMAGE}
          />
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section className="mx-auto max-w-[--container-max] px-[--spacing-margin-mobile] py-16 md:px-[--spacing-margin-desktop]">
        <h2 className="mb-12 text-center text-headline-lg text-on-surface">{t('features.title')}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

          {/* Feature 1: Smart Scheduling — wide */}
          <div className="group relative col-span-1 overflow-hidden rounded-2xl border border-surface-variant bg-surface-bright p-8 shadow-sm transition-shadow hover:shadow-md md:col-span-2">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-container/10 blur-2xl transition-colors group-hover:bg-primary-container/20" />
            <div className="relative">
              <div className="mb-4 text-primary-container"><CalendarIcon size="lg" /></div>
              <h3 className="mb-2 text-headline-md text-on-surface">{t('features.scheduling.title')}</h3>
              <p className="max-w-md text-body-md text-on-surface-variant">{t('features.scheduling.description')}</p>
            </div>
          </div>

          {/* Feature 2: Client Directory */}
          <div className="col-span-1 rounded-2xl border border-surface-variant bg-surface-bright p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 text-primary-container"><GroupIcon size="lg" /></div>
            <h3 className="mb-2 text-headline-md text-on-surface">{t('features.clients.title')}</h3>
            <p className="text-body-md text-on-surface-variant">{t('features.clients.description')}</p>
          </div>

          {/* Feature 3: Pet Profiles */}
          <div className="col-span-1 rounded-2xl border border-surface-variant bg-surface-bright p-8 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 text-primary-container"><PetsIcon size="lg" /></div>
            <h3 className="mb-2 text-headline-md text-on-surface">{t('features.pets.title')}</h3>
            <p className="text-body-md text-on-surface-variant">{t('features.pets.description')}</p>
          </div>

          {/* Feature 4: Service Customization — wide */}
          <div className="col-span-1 rounded-2xl border border-surface-variant bg-surface-bright p-8 shadow-sm transition-shadow hover:shadow-md md:col-span-2">
            <div className="mb-4 text-primary-container"><CutIcon size="lg" /></div>
            <h3 className="mb-2 text-headline-md text-on-surface">{t('features.services.title')}</h3>
            <p className="text-body-md text-on-surface-variant">{t('features.services.description')}</p>
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mx-auto mb-16 flex max-w-[--container-max] flex-col items-center justify-between px-[--spacing-margin-desktop] py-10 md:mb-0 md:flex-row">
        <div className="mb-6 text-center md:mb-0 md:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 opacity-80 transition-opacity hover:opacity-100 md:justify-start">
            <span className="text-primary-container"><PetsIcon size="sm" /></span>
            <span className="text-headline-md text-primary-container">{t('footer.brand')}</span>
          </div>
          <p className="text-body-md text-on-surface-variant">{t('footer.copyright')}</p>
        </div>
        <div className="flex flex-col gap-4 text-center md:flex-row md:text-left">
          <NavLink to="/privacy" className="text-body-md text-on-surface-variant opacity-80 transition-opacity hover:underline hover:opacity-100">{t('footer.privacy')}</NavLink>
          <NavLink to="/terms" className="text-body-md text-on-surface-variant opacity-80 transition-opacity hover:underline hover:opacity-100">{t('footer.terms')}</NavLink>
          <a className="text-body-md text-on-surface-variant opacity-80 transition-opacity hover:underline hover:opacity-100" href="#">{t('footer.contact')}</a>
        </div>
      </footer>
    </>
  );
}
