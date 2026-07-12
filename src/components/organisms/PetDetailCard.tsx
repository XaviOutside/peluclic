import type { Pet } from '@/types/pet';
import { useTranslation } from 'react-i18next';
import StatusBadge from '@/components/molecules/StatusBadge';
import Button from '@/components/atoms/Button';
import { formatDate, formatSex, formatWeight } from '@/utils/format';

export interface PetDetailCardProps {
  pet: Pet;
  clientName?: string;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onViewClient?: () => void;
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

export default function PetDetailCard({
  pet,
  clientName,
  onEdit,
  onDeactivate,
  onReactivate,
  onViewClient,
  onBack,
  deactivateLoading = false,
  reactivateLoading = false,
}: PetDetailCardProps) {
  const { t } = useTranslation(['common', 'pets']);
  const tc = (key: string) => t(key, { ns: 'common' });
  const tp = (key: string, params?: Record<string, unknown>) => t(key, { ns: 'pets', ...params });
  const notProvided = tc('detail.notProvided');

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
      {/* Header */}
      <div className="border-b border-outline-variant bg-surface-container px-6 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-headline text-headline-md text-on-surface">{pet.name}</h2>
            <StatusBadge status={pet.status} />
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            {tc('actions.backToList')}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <dl className="divide-y divide-outline-variant">
          <DetailRow
            label={tp('detail.speciesBreed')}
            value={`${pet.species} — ${pet.breed}`}
            notProvided={notProvided}
          />
          <DetailRow label={tp('detail.sex')} value={formatSex(pet.sex, t)} notProvided={notProvided} />
          <DetailRow
            label={tp('detail.dateOfBirth')}
            value={pet.dateOfBirth ? formatDate(pet.dateOfBirth) : null}
            notProvided={notProvided}
          />
          <DetailRow label={tp('detail.weight')} value={formatWeight(pet.weightKg, t)} notProvided={notProvided} />
          <DetailRow label={tp('detail.notes')} value={pet.notes} notProvided={notProvided} />
          {clientName ? (
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
              <dt className="min-w-[140px] text-label-md text-on-surface-variant">{tp('detail.client')}</dt>
              <dd className="text-body-md">
                {onViewClient ? (
                  <button
                    type="button"
                    onClick={onViewClient}
                    className="text-primary-container hover:underline"
                  >
                    {clientName}
                  </button>
                ) : (
                  <span className="text-on-surface">{clientName}</span>
                )}
              </dd>
            </div>
          ) : (
            <DetailRow
              label={tp('detail.client')}
              value={tp('detail.clientNumber', { id: pet.clientId })}
              notProvided={notProvided}
            />
          )}
          <DetailRow label={tp('detail.created')} value={formatDate(pet.createdAt)} notProvided={notProvided} />
          <DetailRow label={tp('detail.updated')} value={formatDate(pet.updatedAt)} notProvided={notProvided} />
        </dl>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-outline-variant bg-surface-container px-6 py-4 sm:flex-row sm:justify-end">
        {pet.status === 'active' ? (
          <Button variant="danger" onClick={onDeactivate} loading={deactivateLoading}>
            {tc('actions.deactivate')}
          </Button>
        ) : (
          <Button variant="primary" onClick={onReactivate} loading={reactivateLoading}>
            {tc('actions.reactivate')}
          </Button>
        )}
        <Button variant="secondary" onClick={onEdit}>
          {tc('actions.edit')}
        </Button>
      </div>
    </div>
  );
}
