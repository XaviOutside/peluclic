import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TermsPage() {
  const { t } = useTranslation('landing');

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-headline text-headline-xl text-on-surface">{t('terms.title')}</h1>

      <div className="mt-8 space-y-6 text-body-md text-on-surface-variant">
        <section>
          <h2 className="mb-3 font-headline text-headline-md text-on-surface">{t('terms.section1.title')}</h2>
          <p>{t('terms.section1.content')}</p>
        </section>

        <section>
          <h2 className="mb-3 font-headline text-headline-md text-on-surface">{t('terms.section2.title')}</h2>
          <p>{t('terms.section2.content')}</p>
        </section>

        <section>
          <h2 className="mb-3 font-headline text-headline-md text-on-surface">{t('terms.section3.title')}</h2>
          <p>{t('terms.section3.content')}</p>
        </section>

        <section>
          <h2 className="mb-3 font-headline text-headline-md text-on-surface">{t('terms.section4.title')}</h2>
          <p>{t('terms.section4.content')}</p>
        </section>
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
