import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePet } from '@/hooks/usePet';
import { useDeactivatePet } from '@/hooks/usePetMutations';
import PetDetailCard from '@/components/organisms/PetDetailCard';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import Spinner from '@/components/atoms/Spinner';
import Button from '@/components/atoms/Button';

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const petId = id ? Number(id) : undefined;

  const { pet, isLoading, error, refresh } = usePet(petId);
  const deactivateMutation = useDeactivatePet();

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'delete' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleDeactivate() {
    setConfirmAction('deactivate');
    setShowConfirm(true);
  }

  function handleDelete() {
    setConfirmAction('delete');
    setShowConfirm(true);
  }

  function handleReactivate() {
    // Reactivation endpoint not yet available
    setActionError('Reactivation is not yet available. This pet remains inactive.');
  }

  async function handleConfirm() {
    if (!pet || !confirmAction) return;
    setActionError(null);

    try {
      if (confirmAction === 'deactivate') {
        await deactivateMutation.mutate(pet.id);
      }
      setShowConfirm(false);
      setConfirmAction(null);
      navigate('/pets');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed';
      setActionError(message);
    }
  }

  function handleEdit() {
    if (pet) {
      navigate(`/pets/${pet.id}/edit`);
    }
  }

  function handleViewClient() {
    if (pet) {
      navigate(`/clients/${pet.clientId}`);
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
  if (error || !pet) {
    const isNotFound =
      error?.toLowerCase().includes('not found') ||
      error?.toLowerCase().includes('404') ||
      (!error && !isLoading && !pet);

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        {isNotFound ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900">Pet not found</h2>
            <p className="mt-2 text-sm text-gray-500">
              The pet you are looking for does not exist or has been removed.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-red-800">Error loading pet</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="mt-6"
          onClick={() => navigate('/pets')}
        >
          &larr; Back to pets
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PetDetailCard
        pet={pet}
        clientName={`Client #${pet.clientId}`}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
        onViewClient={handleViewClient}
        onBack={() => navigate('/pets')}
        deactivateLoading={deactivateMutation.isLoading}
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
        title={confirmAction === 'deactivate' ? 'Deactivate Pet' : 'Delete Pet'}
        message={
          confirmAction === 'deactivate'
            ? `Are you sure you want to deactivate ${pet.name}?`
            : `Are you sure you want to delete ${pet.name}?`
        }
        confirmLabel={confirmAction === 'deactivate' ? 'Deactivate' : 'Delete'}
        destructive
        isLoading={deactivateMutation.isLoading}
      />
    </div>
  );
}
