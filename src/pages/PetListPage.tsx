import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Pet } from '@/types/pet';
import { usePets } from '@/hooks/usePets';
import { useDeactivatePet } from '@/hooks/usePetMutations';
import { searchPets } from '@/services/pet';
import PetTable from '@/components/organisms/PetTable';
import SearchBar from '@/components/molecules/SearchBar';
import Pagination from '@/components/molecules/Pagination';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import Button from '@/components/atoms/Button';
import Spinner from '@/components/atoms/Spinner';

export default function PetListPage() {
  const navigate = useNavigate();
  const {
    pets: hookPets,
    isLoading: hookLoading,
    error: hookError,
    refresh,
  } = usePets();

  const deactivateMutation = useDeactivatePet();

  // Search state — managed at page level since usePets doesn't include search
  const [searchState, setSearchState] = useState<{
    query: string;
    results: Pet[];
    loading: boolean;
    error: string | null;
  }>({ query: '', results: [], loading: false, error: null });

  // Deactivate dialog state
  const [actionTarget, setActionTarget] = useState<Pet | null>(null);

  // Feedback toast
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Pagination state — ready for backend pagination metadata
  const [page] = useState(1);
  const totalPages = 1;

  const isSearchActive = searchState.query.length > 0;
  const displayPets = isSearchActive ? searchState.results : hookPets;
  const displayError = isSearchActive ? searchState.error : hookError;
  const displayLoading = isSearchActive ? searchState.loading : hookLoading;
  const total = displayPets.length;

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchState({ query: '', results: [], loading: false, error: null });
      return;
    }

    setSearchState((prev) => ({ ...prev, query, loading: true, error: null }));

    try {
      const results = await searchPets(query);
      setSearchState((prev) => ({ ...prev, results, loading: false }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Search failed';
      setSearchState((prev) => ({ ...prev, results: [], loading: false, error: message }));
    }
  }, []);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchState((prev) => ({ ...prev, query }));
      performSearch(query);
    },
    [performSearch],
  );

  const handleSearchSubmit = useCallback(
    (query: string) => {
      performSearch(query);
    },
    [performSearch],
  );

  const handleView = useCallback(
    (pet: Pet) => navigate(`/pets/${pet.id}`),
    [navigate],
  );

  const handleEdit = useCallback(
    (pet: Pet) => navigate(`/pets/${pet.id}/edit`),
    [navigate],
  );

  const handleDeactivate = useCallback((pet: Pet) => {
    setActionTarget(pet);
  }, []);

  const handleReactivate = useCallback(
    (pet: Pet) => {
      // Reactivation endpoint not yet available — show feedback and refresh
      showFeedback('success', `${pet.name} reactivation coming soon.`);
      refresh();
    },
    [refresh],
  );

  async function handleConfirmDeactivate() {
    if (!actionTarget) return;

    try {
      await deactivateMutation.mutate(actionTarget.id);
      showFeedback('success', `${actionTarget.name} has been deactivated.`);
      setActionTarget(null);
      refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Deactivation failed. Please try again.';
      showFeedback('error', message);
    }
  }

  const isMutationLoading = deactivateMutation.isLoading;

  // Loading state (initial load only, not search)
  if (displayLoading && displayPets.length === 0 && !isSearchActive) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state (initial load failure)
  if (displayError && displayPets.length === 0 && !isSearchActive) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-800">{displayError}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={refresh}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Pets</h1>
        <Button onClick={() => navigate('/pets/new')}>Create Pet</Button>
      </div>

      {/* Search */}
      <SearchBar
        value={searchState.query}
        onChange={handleSearchChange}
        onSubmit={handleSearchSubmit}
        placeholder="Search pets..."
      />

      {/* Feedback toast */}
      {feedback && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      {/* Loading overlay for mutations */}
      {isMutationLoading && (
        <div className="flex justify-center py-2">
          <Spinner size="sm" />
        </div>
      )}

      {/* Table */}
      <PetTable
        pets={displayPets}
        onView={handleView}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
      />

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={() => {
          /* pagination ready for backend metadata */
        }}
      />

      {/* Confirm dialog for deactivate */}
      <ConfirmDialog
        isOpen={actionTarget !== null}
        onClose={() => setActionTarget(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Pet"
        message={
          actionTarget
            ? `Are you sure you want to deactivate ${actionTarget.name}?`
            : ''
        }
        confirmLabel="Deactivate"
        destructive
        isLoading={isMutationLoading}
      />
    </div>
  );
}
