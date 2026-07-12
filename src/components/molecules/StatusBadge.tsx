import { useTranslation } from 'react-i18next';
import Badge from '@/components/atoms/Badge';

export interface StatusBadgeProps {
  status: 'active' | 'inactive';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation('common');

  if (status === 'active') {
    return <Badge color="green">{t('status.active')}</Badge>;
  }

  return <Badge color="gray">{t('status.inactive')}</Badge>;
}
