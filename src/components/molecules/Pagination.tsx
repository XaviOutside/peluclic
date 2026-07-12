import { useTranslation } from 'react-i18next';
import Button from '@/components/atoms/Button';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: PaginationProps) {
  const { t } = useTranslation('common');

  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-between border-t border-outline-variant pt-4"
      aria-label={t('pagination.ariaLabel')}
    >
      <p className="text-body-md text-on-surface-variant">
        {t('pagination.showing', { page, totalPages, total })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('pagination.previous')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('pagination.next')}
        </Button>
      </div>
    </nav>
  );
}
