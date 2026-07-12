import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Pet } from '@/types/pet';
import { usePets } from '@/hooks/usePets';
import { useDeactivatePet } from '@/hooks/usePetMutations';
import { useModuleTabs } from '@/hooks/useModuleTabs';
import DataTable from '@/components/organisms/DataTable';
import PageHeader from '@/components/organisms/PageHeader';
import ModuleTabs from '@/components/molecules/ModuleTabs';
import StatusBadge from '@/components/molecules/StatusBadge';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import Button from '@/components/atoms/Button';
import type { ColumnConfig, RowAction, CrossRefAction } from '@/components/organisms/DataTable';

export default function PetsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation(['pets', 'common']);
  const moduleTabs = useModuleTabs();

  const clientIdParam = searchParams.get('clientId');
  const initialClientId = clientIdParam ? parseInt(clientIdParam, 10) : undefined;

  const { pets, isLoading, error, refresh, page, totalCount, totalPages, goToPage } = usePets(initialClientId);

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
      header: t('column.pet'),
      render: (p) => p.name,
      span: 'sm:col-span-3',
    },
    {
      header: t('column.species'),
      render: (p) => p.species,
      span: 'sm:col-span-2',
    },
    {
      header: t('column.breed'),
      render: (p) => p.breed,
      span: 'sm:col-span-2',
    },
    {
      header: t('column.status'),
      render: (p) => <StatusBadge status={p.status} />,
      span: 'sm:col-span-2',
      mobileVisible: false,
    },
  ];

  /* ── Cross-reference actions ── */
  const crossRefActions: CrossRefAction<Pet>[] = [
    {
      key: 'pets-client',
      label: t('common:actions.viewClient'),
      icon: 'person',
      onClick: (p) => navigate(`/clients/${p.clientId}`),
    },
    {
      key: 'pets-services',
      label: t('common:actions.viewServices'),
      icon: 'receipt_long',
      onClick: (p) => navigate(`/services?petId=${p.id}`),
    },
  ];

  /* ── Row actions ── */
  const rowActions: RowAction<Pet>[] = [
    {
      key: 'view',
      label: t('common:actions.view'),
      icon: 'visibility',
      onAction: (p) => navigate(`/pets/${p.id}`),
    },
    {
      key: 'edit',
      label: t('common:actions.edit'),
      icon: 'edit',
      onAction: (p) => navigate(`/pets/${p.id}/edit`),
    },
    {
      key: 'deactivate',
      label: t('common:actions.deactivate'),
      icon: 'delete',
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
        tabs={moduleTabs}
        activeTab="pets"
        onTabChange={(tabId) => {
          if (tabId === 'clients') navigate('/clients');
          else if (tabId === 'services') navigate('/services');
        }}
      />

      {/* ── Header ── */}
      <PageHeader
        searchPlaceholder={t('common:actions.searchPets')}
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
            {t('common:actions.addPet')}
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
        crossRefActions={crossRefActions}
        actionSpan="sm:col-span-3"
        loading={isLoading}
        error={error}
        onRetry={refresh}
        emptyMessage={t('common:empty.noPets')}
        pagination={totalPages > 1 ? { page, totalPages, totalItems: totalCount, onPageChange: goToPage } : undefined}
      />

      {/* ── Confirm dialog ── */}
      <ConfirmDialog
        isOpen={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmDeactivate}
        title={t('deactivate.title')}
        message={
          confirmTarget
            ? t('deactivate.message', { name: confirmTarget.name })
            : ''
        }
        confirmLabel={t('common:actions.deactivate')}
        destructive
        isLoading={deactivateMutation.isLoading}
      />
    </div>
  );
}
