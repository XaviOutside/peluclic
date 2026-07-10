import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Client } from '@/types/client';
import { useClients } from '@/hooks/useClients';
import { useDeactivateClient } from '@/hooks/useClientMutations';
import DataTable from '@/components/organisms/DataTable';
import PageHeader from '@/components/organisms/PageHeader';
import ModuleTabs from '@/components/molecules/ModuleTabs';
import StatusBadge from '@/components/molecules/StatusBadge';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import Button from '@/components/atoms/Button';
import type { ColumnConfig, RowAction } from '@/components/organisms/DataTable';

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
  } = useClients();

  const deactivateMutation = useDeactivateClient();

  const [confirm, setConfirm] = useState<{
    client: Client;
    action: 'deactivate';
  } | null>(null);

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
      render: (c) => c.name,
      span: 'sm:col-span-4',
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
        </div>
      ),
      span: 'sm:col-span-4',
    },
    {
      header: 'Estado',
      render: (c) => <StatusBadge status={c.status} />,
      span: 'sm:col-span-2',
      mobileVisible: false,
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
      key: 'deactivate',
      label: 'Desactivar',
      icon: 'block',
      destructive: true,
      onAction: (c) => {
        if (c.status === 'active') {
          setConfirm({ client: c, action: 'deactivate' });
        }
      },
    },
  ];

  /* ── Confirm handler ── */
  async function handleConfirm() {
    if (!confirm) return;
    const { client } = confirm;

    try {
      await deactivateMutation.mutate(client.id);
      showFeedback('success', `${client.name} desactivado.`);
      setConfirm(null);
      fetchClients();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error en la acción.';
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
        loading={isLoading}
        error={error}
        onRetry={fetchClients}
        emptyMessage="No hay clientes registrados."
      />
    </div>
  );
}
