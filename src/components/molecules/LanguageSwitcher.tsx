import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation('common');

  function toggleLanguage() {
    const next = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
  }

  const currentLabel = i18n.language === 'es' ? t('language.en') : t('language.es');

  return (
    <button
      onClick={toggleLanguage}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 font-label text-label-sm text-on-surface-variant transition-colors hover:bg-secondary-container ${className ?? ''}`}
      aria-label={t('language.switchAria', { lang: currentLabel })}
    >
      <span className="material-symbols-outlined text-sm">language</span>
      {currentLabel}
    </button>
  );
}
