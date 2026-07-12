import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Client } from '@/types/client';
import { useClients } from '@/hooks/useClients';
import { useDeactivateClient } from '@/hooks/useClientMutations';
import DataTable from '@/components/organisms/DataTable';
import PageHeader from '@/components/organisms/PageHeader';
import ModuleTabs from '@/components/molecules/ModuleTabs';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import Button from '@/components/atoms/Button';
import { formatServiceDate } from '@/utils/format';
import type { ColumnConfig, RowAction, CrossRefAction } from '@/components/organisms/DataTable';

const MODULE_TABS = [
  { id: 'clients', label: 'Clientes', icon: 'group' },
  { id: 'pets', label: 'Mascotas', icon: 'pets' },
  { id: 'services', label: 'Servicios', icon: 'content_cut' },
];

export default function ClientsPage() {
  const navigate = useNavigate();
  const {
    clients,
    isLoading,
    error,
    fetchClients,
    searchQuery,
    search,
    setSearchQuery,
    page,
    totalCount,
    totalPages,
    goToPage,
  } = useClients();
  const deactivateMutation = useDeactivateClient();

  const [confirmTarget, setConfirmTarget] = useState<Client | null>(null);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  /* ── Search ── */
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        fetchClients();
      } else {
        search(query);
      }
    },
    [search, setSearchQuery, fetchClients],
  );

  /* ── Column defs ── */
  const columns: ColumnConfig<Client>[] = [
    {
      header: 'Cliente',
      render: (c) => (
        <>
          <span className="font-semibold">{c.name}</span>
          <br />
          <span className="text-sm text-on-surface-variant">#{c.id}</span>
          <br />
          <span className="text-sm text-on-surface-variant">{formatServiceDate(c.lastServiceDate)}</span>
        </>
      ),
      span: 'sm:col-span-3',
    },
    {
      header: 'Contacto',
      render: (c) => (
        <div className="flex flex-col gap-1 text-sm">
          <span className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">mail</span>
            {c.email}
          </span>
          <span className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">phone</span>
            {c.phone}
          </span>
          {c.phone2 && (
            <span className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">phone</span>
              {c.phone2}
            </span>
          )}
          {c.address && (
            <span className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">location_on</span>
              {c.address}
            </span>
          )}
        </div>
      ),
      span: 'sm:col-span-3',
    },
    {
      header: 'Notas',
      render: (c) => (
        <span className="line-clamp-2 text-sm text-on-surface-variant" title={c.notes ?? undefined}>{c.notes || '—'}</span>
      ),
      span: 'sm:col-span-2',
      mobileVisible: false,
    },
  ];

  /* ── Cross-reference actions ── */
  const crossRefActions: CrossRefAction<Client>[] = [
    {
      key: 'clients-pets',
      label: 'Ver Mascotas',
      icon: 'pets',
      onClick: (c) => navigate(`/pets?clientId=${c.id}`),
    },
    {
      key: 'clients-services',
      label: 'Ver Servicios',
      icon: 'receipt_long',
      onClick: () => navigate('/services'),
    },
  ];

  /* ── Row actions ── */
  const rowActions: RowAction<Client>[] = [
    {
      key: 'view',
      label: 'Ver detalles',
      icon: 'visibility',
      onAction: (c) => navigate(`/clients/${c.id}`),
    },
    {
      key: 'edit',
      label: 'Editar',
      icon: 'edit',
      onAction: (c) => navigate(`/clients/${c.id}/edit`),
    },
    {
      key: 'delete',
      label: 'Desactivar',
      icon: 'delete',
      destructive: true,
      onAction: (c) => setConfirmTarget(c),
    },
  ];

  /* ── Confirm handler ── */
  async function handleConfirmDeactivate() {
    if (!confirmTarget) return;
    try {
      await deactivateMutation.mutate(confirmTarget.id);
      showFeedback('success', `${confirmTarget.name} desactivado.`);
      setConfirmTarget(null);
      fetchClients();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al desactivar.';
      showFeedback('error', message);
    }
  }

  return (
    <div className="flex flex-col gap-6" data-testid="clients-page">
      {/* ── Module tabs ── */}
      <ModuleTabs
        tabs={MODULE_TABS}
        activeTab="clients"
        onTabChange={(tabId) => {
          if (tabId === 'pets') navigate('/pets');
          else if (tabId === 'services') navigate('/services');
        }}
      />

      {/* ── Header ── */}
      <PageHeader
        searchPlaceholder="Buscar clientes..."
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        action={
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/clients/new')}
            className="flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Añadir cliente
          </Button>
        }
      />

      {/* ── Feedback toast ── */}
      {feedback && (
        <div
          className={`rounded-lg px-4 py-3 text-label-md ${
            feedback.type === 'success'
              ? 'bg-status-success/15 text-status-success'
              : 'bg-error-container text-on-error-container'
          }`}
          role="alert"
          data-testid="feedback-toast"
        >
          {feedback.message}
        </div>
      )}

      {/* ── Data Table ── */}
      <DataTable
        data={clients}
        columns={columns}
        rowKey={(c) => c.id}
        avatarName={(c) => c.name}
        rowActions={rowActions}
        crossRefActions={crossRefActions}
        actionSpan="sm:col-span-4"
        loading={isLoading}
        error={error}
        onRetry={fetchClients}
        emptyMessage="No hay clientes registrados."
        pagination={totalPages > 1 ? { page, totalPages, totalItems: totalCount, onPageChange: goToPage } : undefined}
      />

      {/* ── Confirm dialog ── */}
      <ConfirmDialog
        isOpen={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmDeactivate}
        title="Desactivar cliente"
        message={
          confirmTarget
            ? `¿Estás seguro de que deseas desactivar a ${confirmTarget.name}?`
            : ''
        }
        confirmLabel="Desactivar"
        destructive
        isLoading={deactivateMutation.isLoading}
      />
    </div>
  );
}
