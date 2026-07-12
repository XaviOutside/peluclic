import type { Client } from '@/types/client';
import { useTranslation } from 'react-i18next';
import StatusBadge from '@/components/molecules/StatusBadge';
import Button from '@/components/atoms/Button';
import { formatDate } from '@/utils/format';

export interface ClientDetailCardProps {
  client: Client;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onBack: () => void;
  deactivateLoading?: boolean;
  reactivateLoading?: boolean;
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

export default function ClientDetailCard({
  client,
  onEdit,
  onDeactivate,
  onReactivate,
  onBack,
  deactivateLoading = false,
  reactivateLoading = false,
}: ClientDetailCardProps) {
  const { t } = useTranslation('common');
  const notProvided = t('detail.notProvided');

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
      {/* Header */}
      <div className="border-b border-outline-variant bg-surface-container px-6 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-headline text-headline-md text-on-surface">{client.name}</h2>
            <StatusBadge status={client.status} />
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            {t('actions.backToList')}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <dl className="divide-y divide-outline-variant">
          <DetailRow label={t('detail.email')} value={client.email} notProvided={notProvided} />
          <DetailRow label={t('detail.phone')} value={client.phone} notProvided={notProvided} />
          <DetailRow label={t('detail.secondaryPhone')} value={client.phone2} notProvided={notProvided} />
          <DetailRow label={t('detail.address')} value={client.address} notProvided={notProvided} />
          <DetailRow label={t('detail.notes')} value={client.notes} notProvided={notProvided} />
          <DetailRow label={t('detail.created')} value={formatDate(client.createdAt)} notProvided={notProvided} />
          <DetailRow label={t('detail.updated')} value={formatDate(client.updatedAt)} notProvided={notProvided} />
        </dl>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-outline-variant bg-surface-container px-6 py-4 sm:flex-row sm:justify-end">
        {client.status === 'active' ? (
          <Button variant="danger" onClick={onDeactivate} loading={deactivateLoading}>
            {t('actions.deactivate')}
          </Button>
        ) : (
          <Button variant="primary" onClick={onReactivate} loading={reactivateLoading}>
            {t('actions.reactivate')}
          </Button>
        )}
        <Button variant="secondary" onClick={onEdit}>
          {t('actions.edit')}
        </Button>
      </div>
    </div>
  );
}
