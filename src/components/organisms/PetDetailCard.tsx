import type { Pet, PetSex } from '@/types/pet';
import StatusBadge from '@/components/molecules/StatusBadge';
import Button from '@/components/atoms/Button';
import { formatDate } from '@/utils/format';

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

function formatSex(sex: PetSex): string {
  switch (sex) {
    case 'male':
      return 'Male';
    case 'female':
      return 'Female';
    default:
      return 'Unknown';
  }
}

function formatWeight(weightKg: number | null): string | null {
  if (weightKg === null || weightKg === undefined) return null;
  return `${weightKg} kg`;
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
            &larr; Back to list
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <dl className="divide-y divide-outline-variant">
          <DetailRow
            label="Species / Breed"
            value={`${pet.species} — ${pet.breed}`}
          />
          <DetailRow label="Sex" value={formatSex(pet.sex)} />
          <DetailRow
            label="Date of Birth"
            value={pet.dateOfBirth ? formatDate(pet.dateOfBirth) : null}
          />
          <DetailRow label="Weight" value={formatWeight(pet.weightKg)} />
          <DetailRow label="Notes" value={pet.notes} />
          {clientName ? (
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
              <dt className="min-w-[140px] text-label-md text-on-surface-variant">Client</dt>
              <dd className="text-body-md">
                {onViewClient ? (
                  <button
                    type="button"
                    onClick={onViewClient}
                    className="text-primary hover:underline"
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
              label="Client"
              value={`Client #${pet.clientId}`}
            />
          )}
          <DetailRow label="Created" value={formatDate(pet.createdAt)} />
          <DetailRow label="Updated" value={formatDate(pet.updatedAt)} />
        </dl>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-outline-variant bg-surface-container px-6 py-4 sm:flex-row sm:justify-end">
        {pet.status === 'active' ? (
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
