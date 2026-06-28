import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Service } from '@/types/service';
import { useServices } from '@/hooks/useServices';
import { searchServices } from '@/services/service';
import ServiceTable from '@/components/organisms/ServiceTable';
import SearchBar from '@/components/molecules/SearchBar';
import Button from '@/components/atoms/Button';
import Spinner from '@/components/atoms/Spinner';

export default function ServiceListPage() {
  const navigate = useNavigate();
  const {
    services: hookServices,
    isLoading: hookLoading,
    error: hookError,
    refresh,
  } = useServices();

  // Search state
  const [searchState, setSearchState] = useState<{
    query: string;
    results: Service[];
    loading: boolean;
    error: string | null;
  }>({ query: '', results: [], loading: false, error: null });

  const isSearchActive = searchState.query.length > 0;
  const displayServices = isSearchActive ? searchState.results : hookServices;
  const displayError = isSearchActive ? searchState.error : hookError;
  const displayLoading = isSearchActive ? searchState.loading : hookLoading;

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchState({ query: '', results: [], loading: false, error: null });
      return;
    }

    setSearchState((prev) => ({ ...prev, query, loading: true, error: null }));

    try {
      const results = await searchServices(query);
      setSearchState((prev) => ({ ...prev, results, loading: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
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

  const handleEdit = useCallback(
    (service: Service) => navigate(`/services/${service.id}/edit`),
    [navigate],
  );

  const handleDelete = useCallback(
    (service: Service) => {
      // Delete is handled on the detail page
      navigate(`/services/${service.id}`);
    },
    [navigate],
  );

  // Loading state
  if (displayLoading && displayServices.length === 0 && !isSearchActive) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (displayError && displayServices.length === 0 && !isSearchActive) {
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
        <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
        <Button onClick={() => navigate('/services/new')}>New Service</Button>
      </div>

      {/* Search */}
      <SearchBar
        value={searchState.query}
        onChange={handleSearchChange}
        onSubmit={(q) => performSearch(q)}
        placeholder="Search services..."
      />

      {/* Empty state */}
      {!isSearchActive && displayServices.length === 0 && !displayLoading && !displayError && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-lg font-medium text-gray-700">No services yet</p>
          <p className="mt-1 text-sm text-gray-500">Create your first service to get started.</p>
          <Button className="mt-4" onClick={() => navigate('/services/new')}>
            Create your first service
          </Button>
        </div>
      )}

      {/* Table */}
      {displayServices.length > 0 && (
        <ServiceTable
          services={displayServices}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
