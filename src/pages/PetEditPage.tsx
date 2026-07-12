import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePet } from '@/hooks/usePet';
import { useUpdatePet } from '@/hooks/usePetMutations';
import { listClients } from '@/services/client';
import type { HttpError } from '@/services/http';
import type { SelectOption } from '@/components/atoms/Select';
import PetForm from '@/components/molecules/PetForm';
import type { PetFormData } from '@/components/molecules/PetForm';
import Button from '@/components/atoms/Button';
import Spinner from '@/components/atoms/Spinner';
import type { FieldErrors } from '@/utils/validation';

export default function PetEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['pets', 'common']);
  const petId = id ? Number(id) : undefined;

  const { pet, isLoading, error } = usePet(petId);
  const updateMutation = useUpdatePet();

  const [clientOptions, setClientOptions] = useState<SelectOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);

  const [serverErrors, setServerErrors] = useState<FieldErrors | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || error || !pet) return;

    let cancelled = false;
    setClientsLoading(true);

    async function fetchClients() {
      try {
        const result = await listClients(1, 200);
        if (cancelled) return;
        const activeOptions: SelectOption[] = result.data
          .filter((c) => c.status === 'active')
          .map((c) => ({
            value: String(c.id),
            label: c.name,
          }));
        setClientOptions(activeOptions);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : t('detail.loadClientsFail');
        setClientsError(message);
      } finally {
        if (!cancelled) {
          setClientsLoading(false);
        }
      }
    }

    fetchClients();

    return () => {
      cancelled = true;
    };
  }, [pet, isLoading, error, t]);

  async function handleSubmit(data: PetFormData) {
    if (!pet) return;
    setServerErrors(null);
    setGeneralError(null);

    try {
      const updated = await updateMutation.mutate(pet.id, {
        name: data.name.trim(),
        species: data.species.trim(),
        breed: data.breed.trim(),
        sex: data.sex as 'unknown' | 'male' | 'female',
        dateOfBirth: data.dateOfBirth || undefined,
        weightKg: data.weightKg ? Number(data.weightKg) : undefined,
        notes: data.notes.trim() || undefined,
      });
      if (updated) {
        navigate(`/pets/${pet.id}`);
      }
    } catch (err) {
      const httpErr = err as HttpError;
      if (httpErr.statusCode === 422 && httpErr.fieldErrors) {
        setServerErrors(httpErr.fieldErrors);
      } else {
        setGeneralError(
          httpErr.message || t('detail.updateFail'),
        );
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (clientsLoading && !clientsError) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !pet || clientsError) {
    const displayError = clientsError || error;
    const isNotFound =
      error?.toLowerCase().includes('not found') ||
      error?.toLowerCase().includes('404') ||
      (!error && !isLoading && !pet);

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        {isNotFound && !clientsError ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900">{t('detail.notFound')}</h2>
            <p className="mt-2 text-sm text-gray-500">
              {t('detail.editNotFound')}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-red-800">{t('detail.loadError')}</h2>
            <p className="mt-2 text-sm text-red-600">{displayError}</p>
          </>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="mt-6"
          onClick={() => navigate('/pets')}
        >
          {t('common:actions.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{t('common:actions.updatePet')}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/pets/${pet.id}`)}
        >
          {t('common:actions.backToList')}
        </Button>
      </div>

      {generalError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {generalError}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <PetForm
          initialData={{
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            sex: pet.sex,
            dateOfBirth: pet.dateOfBirth ?? '',
            weightKg: pet.weightKg?.toString() ?? '',
            notes: pet.notes ?? '',
            clientId: String(pet.clientId),
          }}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isLoading}
          serverErrors={serverErrors}
          clientOptions={clientOptions}
        />
      </div>
    </div>
  );
}
