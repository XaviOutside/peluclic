import type { Service } from '@/types/service';
import { useTranslation } from 'react-i18next';
import StatusBadge from '@/components/molecules/StatusBadge';
import Button from '@/components/atoms/Button';
import { formatDurationLong } from '@/utils/format';

export interface ServiceDetailCardProps {
  service: Service;
  onEdit: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onBack: () => void;
  deactivateLoading?: boolean;
}

interface DetailRowProps {
  label: string;
  value: string | null | undefined;
  notProvided: string;
}

function DetailRow({ label, value, notProvided }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
      <dt className="min-w-[140px] text-label-md text-on-surface-variant">{label}</dt>
      <dd className="text-body-md text-on-surface">
        {value || <span className="italic text-outline">{notProvided}</span>}
      </dd>
    </div>
  );
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export default function ServiceDetailCard({
  service,
  onEdit,
  onDeactivate,
  onDelete,
  onBack,
  deactivateLoading = false,
}: ServiceDetailCardProps) {
  const { t } = useTranslation(['common', 'services']);
  const tc = (key: string) => t(key, { ns: 'common' });
  const ts = (key: string, params?: Record<string, unknown>) => t(key, { ns: 'services', ...params });
  const notProvided = tc('detail.notProvided');

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
      {/* Header */}
      <div className="border-b border-outline-variant bg-surface-container px-6 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-headline text-headline-md text-on-surface">{service.name}</h2>
            <StatusBadge status={service.status} />
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            {tc('actions.backToList')}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <dl className="divide-y divide-outline-variant">
          <DetailRow label={ts('detail.description')} value={service.description} notProvided={notProvided} />
          <DetailRow
            label={ts('detail.duration')}
            value={formatDurationLong(service.durationMinutes, t)}
            notProvided={notProvided}
          />
          <DetailRow label={ts('detail.price')} value={formatPrice(service.price)} notProvided={notProvided} />
        </dl>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-outline-variant bg-surface-container px-6 py-4 sm:flex-row sm:justify-end">
        {service.status === 'active' && (
          <Button variant="danger" onClick={onDeactivate} loading={deactivateLoading}>
            {tc('actions.deactivate')}
          </Button>
        )}
        <Button variant="secondary" onClick={onDelete}>
          {tc('actions.delete')}
        </Button>
        <Button variant="secondary" onClick={onEdit}>
          {tc('actions.edit')}
        </Button>
      </div>
    </div>
  );
}
