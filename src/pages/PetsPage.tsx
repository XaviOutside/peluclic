import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Pet } from '@/types/pet';
import { usePets } from '@/hooks/usePets';
import { useDeactivatePet } from '@/hooks/usePetMutations';
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

export default function PetsPage() {
  const navigate = useNavigate();
  const { pets, isLoading, error, refresh } = usePets();
  const deactivateMutation = useDeactivatePet();

  const [searchText, setSearchText] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<Pet | null>(null);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  /* ── Client-side filter by name ── */
  const filteredPets = searchText.trim()
    ? pets.filter((p) => p.name.toLowerCase().includes(searchText.toLowerCase()))
    : pets;

  /* ── Column defs ── */
  const columns: ColumnConfig<Pet>[] = [
    {
      header: 'Mascota',
      render: (p) => p.name,
      span: 'sm:col-span-3',
    },
    {
      header: 'Especie',
      render: (p) => p.species,
      span: 'sm:col-span-2',
    },
    {
      header: 'Raza',
      render: (p) => p.breed,
      span: 'sm:col-span-3',
    },
    {
      header: 'Estado',
      render: (p) => <StatusBadge status={p.status} />,
      span: 'sm:col-span-2',
      mobileVisible: false,
    },
  ];

  /* ── Row actions ── */
  const rowActions: RowAction<Pet>[] = [
    {
      key: 'view',
      label: 'Ver detalles',
      icon: 'visibility',
      onAction: (p) => navigate(`/pets/${p.id}`),
    },
    {
      key: 'edit',
      label: 'Editar',
      icon: 'edit',
      onAction: (p) => navigate(`/pets/${p.id}/edit`),
    },
    {
      key: 'deactivate',
      label: 'Desactivar',
      icon: 'block',
      destructive: true,
      onAction: (p) => setConfirmTarget(p),
    },
  ];

  /* ── Confirm handler ── */
  async function handleConfirmDeactivate() {
    if (!confirmTarget) return;
    try {
      await deactivateMutation.mutate(confirmTarget.id);
      showFeedback('success', `${confirmTarget.name} desactivado.`);
      setConfirmTarget(null);
      refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al desactivar.';
      showFeedback('error', message);
    }
  }

  return (
    <div className="flex flex-col gap-6" data-testid="pets-page">
      {/* ── Module tabs ── */}
      <ModuleTabs
        tabs={MODULE_TABS}
        activeTab="pets"
        onTabChange={(tabId) => {
          if (tabId === 'clients') navigate('/clients');
          else if (tabId === 'services') navigate('/services');
        }}
      />

      {/* ── Header ── */}
      <PageHeader
        searchPlaceholder="Buscar mascotas..."
        searchValue={searchText}
        onSearchChange={setSearchText}
        action={
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/pets/new')}
            className="flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">pets</span>
            Añadir mascota
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
        data={filteredPets}
        columns={columns}
        rowKey={(p) => p.id}
        avatarName={(p) => p.name}
        rowActions={rowActions}
        loading={isLoading}
        error={error}
        onRetry={refresh}
        emptyMessage="No hay mascotas registradas."
      />

      {/* ── Confirm dialog ── */}
      <ConfirmDialog
        isOpen={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmDeactivate}
        title="Desactivar mascota"
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
