import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Pet } from '@/types/pet';
import type { Service } from '@/types/service';
import { useClient } from '@/hooks/useClient';
import { useDeactivateClient, useReactivateClient } from '@/hooks/useClientMutations';
import { usePets } from '@/hooks/usePets';
import { useServices } from '@/hooks/useServices';
import ClientDetailCard from '@/components/organisms/ClientDetailCard';
import PetTable from '@/components/organisms/PetTable';
import ServiceTable from '@/components/organisms/ServiceTable';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import Spinner from '@/components/atoms/Spinner';
import Button from '@/components/atoms/Button';

function PetServiceCard({ pet }: { pet: Pet }) {
  const {
    services,
    isLoading,
    error,
    refresh,
  } = useServices({ petId: pet.id });

  // Only render if there are linked services or still loading
  if (isLoading) {
    return (
      <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
        <p className="text-sm font-medium text-gray-700">{pet.name}</p>
        <div className="flex justify-center py-2">
          <Spinner size="sm" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
        <p className="text-sm font-medium text-gray-700">{pet.name}</p>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (services.length === 0) {
    return null; // Hidden when no linked services
  }

  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
      <p className="text-sm font-medium text-gray-700 mb-2">{pet.name}</p>
      <div className="text-xs text-gray-600 space-y-1">
        {services.map((svc: Service) => (
          <div key={svc.id} className="flex justify-between items-center">
            <span>{svc.name}</span>
            <span className="text-gray-400">${svc.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clientId = id ? Number(id) : undefined;

  const { client, isLoading, error, refetch } = useClient(clientId);
  const deactivateMutation = useDeactivateClient();
  const reactivateMutation = useReactivateClient();

  // Embedded pet list
  const {
    pets,
    isLoading: petsLoading,
    error: petsError,
  } = usePets(clientId);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'reactivate' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleViewPet = useCallback(
    (pet: Pet) => navigate(`/pets/${pet.id}`),
    [navigate],
  );

  const handleEditPet = useCallback(
    (pet: Pet) => navigate(`/pets/${pet.id}/edit`),
    [navigate],
  );

  const handleDeactivatePet = useCallback(
    (pet: Pet) => navigate(`/pets/${pet.id}`),
    [navigate],
  );

  const handleReactivatePet = useCallback(
    (pet: Pet) => navigate(`/pets/${pet.id}`),
    [navigate],
  );

  function handleDeactivate() {
    setConfirmAction('deactivate');
    setShowConfirm(true);
  }

  function handleReactivate() {
    setConfirmAction('reactivate');
    setShowConfirm(true);
  }

  async function handleConfirm() {
    if (!client || !confirmAction) return;
    setActionError(null);

    try {
      if (confirmAction === 'deactivate') {
        await deactivateMutation.mutate(client.id);
      } else {
        await reactivateMutation.mutate(client.id);
      }
      setShowConfirm(false);
      setConfirmAction(null);
      refetch(client.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed';
      setActionError(message);
    }
  }

  function handleEdit() {
    if (client) {
      navigate(`/clients/${client.id}/edit`);
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
  if (error || !client) {
    const isNotFound =
      error?.toLowerCase().includes('not found') ||
      error?.toLowerCase().includes('404') ||
      (!isLoading && !client);

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        {isNotFound ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900">Client not found</h2>
            <p className="mt-2 text-sm text-gray-500">
              The client you are looking for does not exist or has been removed.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-red-800">Error loading client</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="mt-6"
          onClick={() => navigate('/clients')}
        >
          &larr; Back to clients
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ClientDetailCard
        client={client}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
        onBack={() => navigate('/clients')}
        deactivateLoading={deactivateMutation.isLoading}
        reactivateLoading={reactivateMutation.isLoading}
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
        title={
          confirmAction === 'deactivate' ? 'Deactivate Client' : 'Reactivate Client'
        }
        message={
          confirmAction === 'deactivate'
            ? `Are you sure you want to deactivate ${client.name}? They will no longer appear in active searches.`
            : `Are you sure you want to reactivate ${client.name}?`
        }
        confirmLabel={confirmAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        destructive={confirmAction === 'deactivate'}
        isLoading={deactivateMutation.isLoading || reactivateMutation.isLoading}
      />

      {/* Embedded pet list */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Pets</h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/pets/new')}
          >
            Add Pet
          </Button>
        </div>
        <div className="px-6 py-4">
          {petsLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : petsError ? (
            <p className="text-sm text-red-600">{petsError}</p>
          ) : (
            <PetTable
              pets={pets}
              onView={handleViewPet}
              onEdit={handleEditPet}
              onDeactivate={handleDeactivatePet}
              onReactivate={handleReactivatePet}
            />
          )}
        </div>
      </div>

      {/* Services by Pet — per-pet linked services */}
      {!petsLoading && !petsError && pets.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Services by Pet</h2>
          </div>
          <div className="px-6 py-4 space-y-3">
            {pets.map((pet) => (
              <PetServiceCard key={pet.id} pet={pet} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
