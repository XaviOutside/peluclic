import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Client } from '@/types/client';
import { useClients } from '@/hooks/useClients';
import DataTable from '@/components/organisms/DataTable';
import PageHeader from '@/components/organisms/PageHeader';
import ModuleTabs from '@/components/molecules/ModuleTabs';
import StatusBadge from '@/components/molecules/StatusBadge';
import Button from '@/components/atoms/Button';
import { formatServiceDate } from '@/utils/format';
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
      span: 'sm:col-span-5',
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
  ];

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
