import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Client } from '@/types/client';
import { useClients } from '@/hooks/useClients';
import { useDeactivateClient, useReactivateClient } from '@/hooks/useClientMutations';
import ClientTable from '@/components/organisms/ClientTable';
import SearchBar from '@/components/molecules/SearchBar';
import Pagination from '@/components/molecules/Pagination';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import Button from '@/components/atoms/Button';
import Spinner from '@/components/atoms/Spinner';

export default function ClientListPage() {
  const navigate = useNavigate();
  const {
    clients,
    isLoading,
    error,
    searchQuery,
    search,
    setSearchQuery,
    fetchClients,
  } = useClients();

  const deactivateMutation = useDeactivateClient();
  const reactivateMutation = useReactivateClient();

  // Deactivate/reactivate dialog state
  const [actionTarget, setActionTarget] = useState<{
    client: Client;
    action: 'deactivate' | 'reactivate';
  } | null>(null);

  // Feedback toast
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Pagination state — the backend currently returns a flat array
  // Pagination is ready for when pagination metadata is added
  const [page] = useState(1);
  const totalPages = 1;
  const total = clients.length;

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      search(query);
    },
    [search, setSearchQuery],
  );

  const handleSearchSubmit = useCallback(
    (query: string) => {
      search(query);
    },
    [search],
  );

  // Open deactivate or reactivate confirmation
  const handleDeactivate = useCallback((client: Client) => {
    setActionTarget({ client, action: 'deactivate' });
  }, []);

  const handleReactivate = useCallback((client: Client) => {
    setActionTarget({ client, action: 'reactivate' });
  }, []);

  // Confirm the dialog action
  async function handleConfirmAction() {
    if (!actionTarget) return;

    const { client, action } = actionTarget;

    try {
      if (action === 'deactivate') {
        await deactivateMutation.mutate(client.id);
        showFeedback('success', `${client.name} has been deactivated.`);
      } else {
        await reactivateMutation.mutate(client.id);
        showFeedback('success', `${client.name} has been reactivated.`);
      }
      setActionTarget(null);
      // Refresh the list
      fetchClients();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Action failed. Please try again.';
      showFeedback('error', message);
    }
  }

  const handleView = useCallback(
    (client: Client) => navigate(`/clients/${client.id}`),
    [navigate],
  );

  const handleEdit = useCallback(
    (client: Client) => navigate(`/clients/${client.id}/edit`),
    [navigate],
  );

  const isMutationLoading =
    deactivateMutation.isLoading || reactivateMutation.isLoading;

  // Loading state (initial load only)
  if (isLoading && clients.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state (initial load failure)
  if (error && clients.length === 0) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-800">{error}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={fetchClients}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
        <Button onClick={() => navigate('/clients/new')}>Create Client</Button>
      </div>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={handleSearchChange}
        onSubmit={handleSearchSubmit}
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
      <ClientTable
        clients={clients}
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

      {/* Confirm dialog for deactivate/reactivate */}
      <ConfirmDialog
        isOpen={actionTarget !== null}
        onClose={() => setActionTarget(null)}
        onConfirm={handleConfirmAction}
        title={
          actionTarget?.action === 'deactivate'
            ? 'Deactivate Client'
            : 'Reactivate Client'
        }
        message={
          actionTarget
            ? `Are you sure you want to ${actionTarget.action} ${actionTarget.client.name}?`
            : ''
        }
        confirmLabel={
          actionTarget?.action === 'deactivate' ? 'Deactivate' : 'Reactivate'
        }
        destructive={actionTarget?.action === 'deactivate'}
        isLoading={isMutationLoading}
      />
    </div>
  );
}
