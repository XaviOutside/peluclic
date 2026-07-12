import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePet } from '@/hooks/usePet';
import { useDeactivatePet } from '@/hooks/usePetMutations';
import { useServices } from '@/hooks/useServices';
import { listServices, updateService } from '@/services/service';
import type { Service } from '@/types/service';
import PetDetailCard from '@/components/organisms/PetDetailCard';
import ServiceTable from '@/components/organisms/ServiceTable';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import Modal from '@/components/atoms/Modal';
import Select from '@/components/atoms/Select';
import Spinner from '@/components/atoms/Spinner';
import Button from '@/components/atoms/Button';

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['pets', 'common']);
  const petId = id ? Number(id) : undefined;

  const { pet, isLoading, error } = usePet(petId);
  const deactivateMutation = useDeactivatePet();

  const {
    services: linkedServices,
    isLoading: servicesLoading,
    error: servicesError,
    refresh: refreshServices,
  } = useServices(petId ? { petId } : undefined);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'delete' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [unlinkedServices, setUnlinkedServices] = useState<Service[]>([]);
  const [linkModalLoading, setLinkModalLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [linking, setLinking] = useState(false);

  function handleDeactivate() {
    setConfirmAction('deactivate');
    setShowConfirm(true);
  }

  function handleReactivate() {
    setActionError(t('detail.reactivateUnavailable'));
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
      const message = err instanceof Error ? err.message : t('detail.actionFailed');
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

  async function handleUnlink(service: Service) {
    try {
      await updateService(service.id, { petId: null });
      refreshServices();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('detail.unlinkFail');
      setActionError(message);
    }
  }

  async function handleOpenLinkModal() {
    setShowLinkModal(true);
    setLinkModalLoading(true);
    setActionError(null);
    try {
      const result = await listServices(1, 200);
      setUnlinkedServices(result.data.filter((s) => s.petId === null));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('detail.loadServicesFail');
      setActionError(message);
    } finally {
      setLinkModalLoading(false);
    }
  }

  async function handleLink() {
    if (!selectedServiceId || !petId) return;
    setLinking(true);
    try {
      await updateService(Number(selectedServiceId), { petId });
      await refreshServices();
      setShowLinkModal(false);
      setSelectedServiceId('');
      setUnlinkedServices([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('detail.linkFail');
      setActionError(message);
    } finally {
      setLinking(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !pet) {
    const isNotFound =
      error?.toLowerCase().includes('not found') ||
      error?.toLowerCase().includes('404') ||
      (!error && !isLoading && !pet);

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        {isNotFound ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900">{t('detail.notFound')}</h2>
            <p className="mt-2 text-sm text-gray-500">
              {t('detail.notFoundMessage')}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-red-800">{t('detail.loadError')}</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="mt-6"
          onClick={() => navigate('/pets')}
        >
          {t('common:actions.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PetDetailCard
        pet={pet}
        clientName={t('detail.clientNumber', { id: pet.clientId })}
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
        title={confirmAction === 'deactivate' ? t('detail.deactivatePet') : t('detail.deletePet')}
        message={
          confirmAction === 'deactivate'
            ? t('detail.deactivateMessage', { name: pet.name })
            : t('detail.deleteMessage', { name: pet.name })
        }
        confirmLabel={confirmAction === 'deactivate' ? t('common:actions.deactivate') : t('common:actions.delete')}
        destructive
        isLoading={deactivateMutation.isLoading}
      />

      {/* Linked Services Section */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('detail.linkedServices')}</h2>
        </div>
        <div className="px-6 py-4">
          {servicesLoading && (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          )}
          {servicesError && (
            <div className="text-center py-4">
              <p className="text-sm text-red-600">{servicesError}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={refreshServices}
              >
                {t('common:errors.retry')}
              </Button>
            </div>
          )}
          {!servicesLoading && !servicesError && linkedServices.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">{t('detail.noLinkedServices')}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={handleOpenLinkModal}
              >
                {t('detail.linkService')}
              </Button>
            </div>
          )}
          {!servicesLoading && !servicesError && linkedServices.length > 0 && (
            <ServiceTable
              services={linkedServices}
              onEdit={() => navigate('/services')}
              onDelete={handleUnlink}
              onUnlink={handleUnlink}
            />
          )}
        </div>
      </div>

      {/* Link Service Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setSelectedServiceId('');
        }}
        title={t('detail.linkService')}
      >
        {linkModalLoading && (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}
        {!linkModalLoading && unlinkedServices.length === 0 && (
          <p className="text-sm text-gray-500 py-4">{t('detail.noAvailableServices')}</p>
        )}
        {!linkModalLoading && unlinkedServices.length > 0 && (
          <>
            <Select
              label={t('detail.selectService')}
              options={[
                { value: '', label: t('detail.selectServicePlaceholder') },
                ...unlinkedServices.map((s) => ({
                  value: String(s.id),
                  label: `${s.name} ($${s.price.toFixed(2)})`,
                })),
              ]}
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedServiceId('');
                }}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={linking}
                disabled={!selectedServiceId}
                onClick={handleLink}
              >
                {t('detail.link')}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
