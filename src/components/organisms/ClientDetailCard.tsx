import type { Client } from '@/types/client';
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
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
      <dt className="min-w-[140px] text-label-md text-on-surface-variant">{label}</dt>
      <dd className="text-body-md text-on-surface">
        {value || <span className="italic text-outline">Not provided</span>}
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
            &larr; Back to list
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <dl className="divide-y divide-outline-variant">
          <DetailRow label="Email" value={client.email} />
          <DetailRow label="Phone" value={client.phone} />
          <DetailRow label="Secondary Phone" value={client.phone2} />
          <DetailRow label="Address" value={client.address} />
          <DetailRow label="Created" value={formatDate(client.createdAt)} />
          <DetailRow label="Updated" value={formatDate(client.updatedAt)} />
        </dl>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-outline-variant bg-surface-container px-6 py-4 sm:flex-row sm:justify-end">
        {client.status === 'active' ? (
          <Button variant="danger" onClick={onDeactivate} loading={deactivateLoading}>
            Deactivate
          </Button>
        ) : (
          <Button variant="primary" onClick={onReactivate} loading={reactivateLoading}>
            Reactivate
          </Button>
        )}
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </div>
  );
}
