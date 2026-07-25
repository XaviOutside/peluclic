import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PrivacySection {
  title: string;
  content: string;
}

export default function PrivacyPage() {
  const { t } = useTranslation('landing');

  const sections = t('privacy.sections', { returnObjects: true }) as unknown as PrivacySection[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-headline text-headline-xl text-on-surface">{t('privacy.title')}</h1>

      <div className="mt-8 space-y-6 text-body-md text-on-surface-variant">
        {sections.map((section, idx) => (
          <section key={idx}>
            <h2 className="mb-3 font-headline text-headline-md text-on-surface">{section.title}</h2>
            <p>{section.content}</p>
          </section>
        ))}
      </div>

      <NavLink
        to="/"
        className="mt-10 inline-flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-high px-4 py-2 font-label text-label-md text-on-surface transition-all duration-150 hover:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {t('register.backHome')}
      </NavLink>
    </div>
  );
}
