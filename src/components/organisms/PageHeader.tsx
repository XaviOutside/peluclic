import type { ReactNode } from 'react';
import SearchInput from '@/components/molecules/SearchInput';

export interface PageHeaderProps {
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Current search value */
  searchValue?: string;
  /** Called when search value changes */
  onSearchChange?: (value: string) => void;
  /** Primary action button */
  action?: ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether to hide the search input */
  hideSearch?: boolean;
}

export default function PageHeader({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  action,
  className = '',
  hideSearch = false,
}: PageHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 rounded-xl border border-outline-variant/20 bg-surface-container-lowest/90 p-4 shadow-sm backdrop-blur-sm ${className}`}
      data-testid="page-header"
    >
      {!hideSearch && (
        <div className="flex-1 w-full max-w-md">
          <SearchInput
            value={searchValue}
            onValueChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>
      )}
      {action && (
        <div className="w-full sm:w-auto flex-shrink-0">{action}</div>
      )}
    </header>
  );
}
