import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServices } from '@/hooks/useServices';
import ServiceDetailCard from '@/components/organisms/ServiceDetailCard';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import Spinner from '@/components/atoms/Spinner';
import Button from '@/components/atoms/Button';

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const serviceId = id ? Number(id) : undefined;

  const {
    service,
    fetchService,
    isLoading,
    error,
    deactivateService,
    deleteService,
  } = useServices();

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'delete' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch service on mount
  useEffect(() => {
    if (serviceId && serviceId > 0) {
      fetchService(serviceId);
    }
  }, [serviceId, fetchService]);

  function handleDeactivate() {
    setConfirmAction('deactivate');
    setShowConfirm(true);
  }

  function handleDelete() {
    setConfirmAction('delete');
    setShowConfirm(true);
  }

  async function handleConfirm() {
    if (!service || !confirmAction) return;
    setActionError(null);
    setActionLoading(true);

    try {
      if (confirmAction === 'deactivate') {
        await deactivateService(service.id);
        // Re-fetch to update local state
        fetchService(service.id);
      } else if (confirmAction === 'delete') {
        await deleteService(service.id);
        navigate('/services');
        return;
      }
      setShowConfirm(false);
      setConfirmAction(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed';
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  }

  function handleEdit() {
    if (service) {
      navigate(`/services/${service.id}/edit`);
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

  // Error / 404 state
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
              The service you are looking for does not exist or has been removed.
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
    <div className="mx-auto max-w-2xl space-y-6">
      <ServiceDetailCard
        service={service}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        onDelete={handleDelete}
        onBack={() => navigate('/services')}
        deactivateLoading={actionLoading && confirmAction === 'deactivate'}
      />

      {actionError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {actionError}
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setConfirmAction(null);
        }}
        onConfirm={handleConfirm}
        title={confirmAction === 'deactivate' ? 'Deactivate Service' : 'Delete Service'}
        message={
          service
            ? confirmAction === 'deactivate'
              ? `Are you sure you want to deactivate ${service.name}?`
              : `Are you sure you want to delete ${service.name}?`
            : ''
        }
        confirmLabel={confirmAction === 'deactivate' ? 'Deactivate' : 'Delete'}
        destructive
        isLoading={actionLoading}
      />
    </div>
  );
}
