import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Service } from '@/types/service';
import { useServices } from '@/hooks/useServices';
import { searchServices } from '@/services/service';
import DataTable from '@/components/organisms/DataTable';
import PageHeader from '@/components/organisms/PageHeader';
import ModuleTabs from '@/components/molecules/ModuleTabs';
import StatusBadge from '@/components/molecules/StatusBadge';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import Button from '@/components/atoms/Button';
import type { ColumnConfig, RowAction, CrossRefAction } from '@/components/organisms/DataTable';

const MODULE_TABS = [
  { id: 'clients', label: 'Clientes', icon: 'group' },
  { id: 'pets', label: 'Mascotas', icon: 'pets' },
  { id: 'services', label: 'Servicios', icon: 'content_cut' },
];

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  return `${minutes} min`;
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const petIdParam = searchParams.get('petId');
  const petId = petIdParam ? parseInt(petIdParam, 10) : undefined;

  const {
    services: hookServices,
    isLoading: hookLoading,
    error: hookError,
    refresh,
    deleteService,
  } = useServices({ petId });

  /* Search state */
  const [searchState, setSearchState] = useState<{
    query: string;
    results: Service[];
    loading: boolean;
    error: string | null;
  }>({ query: '', results: [], loading: false, error: null });

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isSearchActive = searchState.query.length > 0;
  const displayServices = isSearchActive ? searchState.results : hookServices;
  const displayError = isSearchActive ? searchState.error : hookError;
  const displayLoading = isSearchActive ? searchState.loading : hookLoading;

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  /* ── Search ── */
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

  /* ── Delete handler ── */
  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteService(deleteTarget.id);
      showFeedback('success', `${deleteTarget.name} eliminado.`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al eliminar.';
      showFeedback('error', message);
    } finally {
      setDeleting(false);
    }
  }

  /* ── Column defs ── */
  const columns: ColumnConfig<Service>[] = [
    {
      header: 'Servicio',
      render: (s) => s.name,
      span: 'sm:col-span-2',
    },
    {
      header: 'Descripción',
      render: (s) => (
        <span className="text-sm text-on-surface-variant line-clamp-2">
          {s.description || '—'}
        </span>
      ),
      span: 'sm:col-span-2',
    },
    {
      header: 'Duración',
      render: (s) => formatDuration(s.durationMinutes),
      span: 'sm:col-span-2',
      align: 'center',
    },
    {
      header: 'Precio',
      render: (s) => (
        <span className="font-headline font-semibold text-primary-container">
          {formatPrice(s.price)}
        </span>
      ),
      span: 'sm:col-span-2',
      align: 'right',
    },
    {
      header: 'Estado',
      render: (s) => <StatusBadge status={s.status} />,
      span: 'sm:col-span-1',
      mobileVisible: false,
    },
  ];

  /* ── Cross-reference actions ── */
  const crossRefActions: CrossRefAction<Service>[] = [
    {
      key: 'services-pet',
      label: 'Ver mascota',
      icon: 'pets',
      onClick: (s) => s.petId !== null && navigate(`/pets/${s.petId}`),
      disabled: (s) => s.petId === null,
    },
  ];

  /* ── Row actions ── */
  const rowActions: RowAction<Service>[] = [
    {
      key: 'view',
      label: 'Ver detalles',
      icon: 'visibility',
      onAction: (s) => navigate(`/services/${s.id}`),
    },
    {
      key: 'edit',
      label: 'Editar',
      icon: 'edit',
      onAction: (s) => navigate(`/services/${s.id}/edit`),
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      destructive: true,
      onAction: (s) => setDeleteTarget(s),
    },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="services-page">
      {/* ── Module tabs ── */}
      <ModuleTabs
        tabs={MODULE_TABS}
        activeTab="services"
        onTabChange={(tabId) => {
          if (tabId === 'clients') navigate('/clients');
          else if (tabId === 'pets') navigate('/pets');
        }}
      />

      {/* ── Header ── */}
      <PageHeader
        searchPlaceholder="Buscar servicios..."
        searchValue={searchState.query}
        onSearchChange={handleSearchChange}
        action={
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/services/new')}
            className="flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nuevo servicio
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
        data={displayServices}
        columns={columns}
        rowKey={(s) => s.id}
        avatarName={(s) => s.name}
        rowActions={rowActions}
        crossRefActions={crossRefActions}
        actionSpan="sm:col-span-3"
        loading={displayLoading}
        error={displayError}
        onRetry={refresh}
        emptyMessage="No hay servicios registrados."
      />

      {/* ── Confirm dialog ── */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar servicio"
        message={
          deleteTarget
            ? `¿Estás seguro de que deseas eliminar "${deleteTarget.name}"?`
            : ''
        }
        confirmLabel="Eliminar"
        destructive
        isLoading={deleting}
      />
    </div>
  );
}
