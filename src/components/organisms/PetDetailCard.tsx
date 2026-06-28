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
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:gap-4">
      <dt className="min-w-[140px] text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">
        {value || <span className="italic text-gray-400">Not provided</span>}
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{pet.name}</h2>
            <StatusBadge status={pet.status} />
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            &larr; Back to list
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <dl className="divide-y divide-gray-100">
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
            <div className="flex flex-col gap-1 py-2 sm:flex-row sm:gap-4">
              <dt className="min-w-[140px] text-sm font-medium text-gray-500">Client</dt>
              <dd className="text-sm">
                {onViewClient ? (
                  <button
                    type="button"
                    onClick={onViewClient}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {clientName}
                  </button>
                ) : (
                  <span className="text-gray-900">{clientName}</span>
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
      <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
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
