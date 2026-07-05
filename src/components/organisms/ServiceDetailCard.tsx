import type { Service } from '@/types/service';
import StatusBadge from '@/components/molecules/StatusBadge';
import Button from '@/components/atoms/Button';

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

function formatDuration(minutes: number | null): string | null {
  if (minutes === null) return null;
  return `${minutes} minutes`;
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
            &larr; Back to list
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <dl className="divide-y divide-outline-variant">
          <DetailRow label="Description" value={service.description} />
          <DetailRow
            label="Duration"
            value={formatDuration(service.durationMinutes)}
          />
          <DetailRow label="Price" value={formatPrice(service.price)} />
        </dl>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-outline-variant bg-surface-container px-6 py-4 sm:flex-row sm:justify-end">
        {service.status === 'active' && (
          <Button variant="danger" onClick={onDeactivate} loading={deactivateLoading}>
            Deactivate
          </Button>
        )}
        <Button variant="secondary" onClick={onDelete}>
          Delete
        </Button>
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </div>
  );
}
