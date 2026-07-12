import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCreateClient } from '@/hooks/useClientMutations';
import type { HttpError } from '@/services/http';
import ClientForm from '@/components/molecules/ClientForm';
import type { ClientFormData } from '@/components/molecules/ClientForm';
import Button from '@/components/atoms/Button';
import type { FieldErrors } from '@/utils/validation';

export default function ClientCreatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['clients', 'common']);
  const createMutation = useCreateClient();
  const [serverErrors, setServerErrors] = useState<FieldErrors | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  async function handleSubmit(data: ClientFormData) {
    setServerErrors(null);
    setGeneralError(null);

    try {
      const client = await createMutation.mutate({
        name: data.name,
        email: data.email,
        phone: data.phone,
        phone2: data.phone2 || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
      });
      if (client) {
        navigate(`/clients/${client.id}`);
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

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{t('common:actions.createClient')}</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
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
          onSubmit={handleSubmit}
          isLoading={createMutation.isLoading}
          serverErrors={serverErrors}
        />
      </div>
    </div>
  );
}
