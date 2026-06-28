import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServices } from '@/hooks/useServices';
import type { HttpError } from '@/services/http';
import ServiceForm from '@/components/molecules/ServiceForm';
import type { ServiceFormData } from '@/components/molecules/ServiceForm';
import Button from '@/components/atoms/Button';
import Spinner from '@/components/atoms/Spinner';
import type { FieldErrors } from '@/utils/validation';

export default function ServiceEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const serviceId = id ? Number(id) : undefined;

  const { service, fetchService, isLoading, error, updateService } = useServices();

  const [serverErrors, setServerErrors] = useState<FieldErrors | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch service on mount
  useEffect(() => {
    if (serviceId && serviceId > 0) {
      fetchService(serviceId);
    }
  }, [serviceId, fetchService]);

  async function handleSubmit(data: ServiceFormData) {
    if (!serviceId || !service) return;
    setServerErrors(null);
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      const priceInCents = Math.round(Number(data.price) * 100);
      const updated = await updateService(serviceId, {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        durationMinutes: data.durationMinutes
          ? Number(data.durationMinutes)
          : undefined,
        price: priceInCents,
      });
      if (updated) {
        navigate(`/services/${serviceId}`);
      }
    } catch (err) {
      const httpErr = err as HttpError;
      if (httpErr.statusCode === 422 && httpErr.fieldErrors) {
        setServerErrors(httpErr.fieldErrors);
      } else {
        setGeneralError(
          httpErr.message || 'Failed to update service. Please try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error / not found
  if (error || !service) {
    const isNotFound =
      error?.toLowerCase().includes('not found') ||
      (!error && !isLoading && !service);

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        {isNotFound ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900">Service not found</h2>
            <p className="mt-2 text-sm text-gray-500">
              The service you are trying to edit does not exist.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-red-800">Error loading service</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="mt-6"
          onClick={() => navigate('/services')}
        >
          &larr; Back to services
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Service</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/services/${service.id}`)}
        >
          &larr; Back
        </Button>
      </div>

      {generalError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {generalError}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <ServiceForm
          initialData={{
            name: service.name,
            description: service.description ?? '',
            durationMinutes: service.durationMinutes?.toString() ?? '',
            price: service.price.toString(),
          }}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          serverErrors={serverErrors}
        />
      </div>
    </div>
  );
}
