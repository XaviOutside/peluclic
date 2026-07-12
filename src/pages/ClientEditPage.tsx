import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClient } from '@/hooks/useClient';
import { useUpdateClient } from '@/hooks/useClientMutations';
import type { HttpError } from '@/services/http';
import ClientForm from '@/components/molecules/ClientForm';
import type { ClientFormData } from '@/components/molecules/ClientForm';
import Spinner from '@/components/atoms/Spinner';
import Button from '@/components/atoms/Button';
import type { FieldErrors } from '@/utils/validation';

export default function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['clients', 'common']);
  const clientId = id ? Number(id) : undefined;

  const { client, isLoading, error } = useClient(clientId);
  const updateMutation = useUpdateClient();
  const [serverErrors, setServerErrors] = useState<FieldErrors | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  async function handleSubmit(data: ClientFormData) {
    if (!client) return;
    setServerErrors(null);
    setGeneralError(null);

    try {
      const updated = await updateMutation.mutate(client.id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        phone2: data.phone2 || null,
        address: data.address || null,
        notes: data.notes || null,
      });
      if (updated) {
        navigate(`/clients/${client.id}`);
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

  if (error || !client) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('detail.notFound')}</h2>
        <p className="mt-2 text-sm text-gray-500">
          {t('detail.editNotFoundMessage') || t('detail.notFoundMessage')}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-6"
          onClick={() => navigate('/clients')}
        >
          {t('common:actions.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{t('common:actions.updateClient')}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/clients/${client.id}`)}
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
        <ClientForm
          initialData={{
            name: client.name,
            email: client.email,
            phone: client.phone,
            phone2: client.phone2 ?? '',
            address: client.address ?? '',
            notes: client.notes ?? '',
          }}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isLoading}
          serverErrors={serverErrors}
        />
      </div>
    </div>
  );
}
