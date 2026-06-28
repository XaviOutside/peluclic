import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '@/hooks/useServices';
import type { HttpError } from '@/services/http';
import ServiceForm from '@/components/molecules/ServiceForm';
import type { ServiceFormData } from '@/components/molecules/ServiceForm';
import Button from '@/components/atoms/Button';
import type { FieldErrors } from '@/utils/validation';

export default function ServiceCreatePage() {
  const navigate = useNavigate();
  const { createService } = useServices();

  const [serverErrors, setServerErrors] = useState<FieldErrors | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: ServiceFormData) {
    setServerErrors(null);
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      // Convert dollars to cents for API
      const priceInCents = Math.round(Number(data.price) * 100);
      const service = await createService({
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        durationMinutes: data.durationMinutes
          ? Number(data.durationMinutes)
          : undefined,
        price: priceInCents,
      });
      if (service) {
        navigate(`/services/${service.id}`);
      }
    } catch (err) {
      const httpErr = err as HttpError;
      if (httpErr.statusCode === 422 && httpErr.fieldErrors) {
        setServerErrors(httpErr.fieldErrors);
      } else {
        setGeneralError(
          httpErr.message || 'Failed to create service. Please try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Create Service</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/services')}>
          &larr; Back
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
        <ServiceForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          serverErrors={serverErrors}
        />
      </div>
    </div>
  );
}
