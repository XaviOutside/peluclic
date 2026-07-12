import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCreatePet } from '@/hooks/usePetMutations';
import { listClients } from '@/services/client';
import type { HttpError } from '@/services/http';
import type { SelectOption } from '@/components/atoms/Select';
import PetForm from '@/components/molecules/PetForm';
import type { PetFormData } from '@/components/molecules/PetForm';
import Button from '@/components/atoms/Button';
import Spinner from '@/components/atoms/Spinner';
import type { FieldErrors } from '@/utils/validation';

export default function PetCreatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['pets', 'common']);
  const createMutation = useCreatePet();

  const [clientOptions, setClientOptions] = useState<SelectOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);

  const [serverErrors, setServerErrors] = useState<FieldErrors | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

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
  }, [t]);

  async function handleSubmit(data: PetFormData) {
    setServerErrors(null);
    setGeneralError(null);

    try {
      const pet = await createMutation.mutate({
        clientId: Number(data.clientId),
        name: data.name.trim(),
        species: data.species.trim(),
        breed: data.breed.trim(),
        sex: data.sex as 'unknown' | 'male' | 'female',
        dateOfBirth: data.dateOfBirth || undefined,
        weightKg: data.weightKg ? Number(data.weightKg) : undefined,
        notes: data.notes.trim() || undefined,
      });
      if (pet) {
        navigate(`/pets/${pet.id}`);
      }
    } catch (err) {
      const httpErr = err as HttpError;
      if (httpErr.statusCode === 422 && httpErr.fieldErrors) {
        setServerErrors(httpErr.fieldErrors);
      } else {
        setGeneralError(
          httpErr.message || t('detail.createFail'),
        );
      }
    }
  }

  if (clientsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-800">{clientsError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{t('common:actions.createPet')}</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/pets')}>
          {t('common:actions.backToList')}
        </Button>
      </div>

      {generalError && (
        <div
          className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {generalError}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <PetForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isLoading}
          serverErrors={serverErrors}
          clientOptions={clientOptions}
        />
      </div>
    </div>
  );
}
