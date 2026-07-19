import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import SearchInput from '@/components/molecules/SearchInput';

export interface PageHeaderProps {
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Current search value */
  searchValue?: string;
  /** Called when search value changes */
  onSearchChange?: (value: string) => void;
  /** Called when explicit search is triggered (Enter key or button click) */
  onSearchSubmit?: () => void;
  /** Primary action button */
  action?: ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether to hide the search input */
  hideSearch?: boolean;
}

export default function PageHeader({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  action,
  className = '',
  hideSearch = false,
}: PageHeaderProps) {
  const { t } = useTranslation('common');

  return (
    <header
      className={`sticky top-0 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 rounded-xl border border-outline-variant/20 bg-surface-container-lowest/90 p-4 shadow-sm backdrop-blur-sm ${className}`}
      data-testid="page-header"
    >
      {!hideSearch && (
        <div className="flex-1 w-full max-w-md flex items-center gap-2">
          <div className="flex-1">
            <SearchInput
              value={searchValue}
              onValueChange={onSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onSearchSubmit) {
                  e.preventDefault();
                  onSearchSubmit();
                }
              }}
              placeholder={searchPlaceholder ?? t('actions.search')}
            />
          </div>
          {onSearchSubmit && (
            <button
              type="button"
              onClick={onSearchSubmit}
              data-testid="search-submit"
              className="flex-shrink-0 rounded-lg border border-outline-variant bg-surface p-2 text-outline hover:bg-surface-container-highest hover:text-on-surface transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={t('actions.search')}
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                search
              </span>
            </button>
          )}
        </div>
      )}
      {action && (
        <div className="w-full sm:w-auto flex-shrink-0">{action}</div>
      )}
    </header>
  );
}
