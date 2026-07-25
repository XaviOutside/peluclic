import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Client } from '@/types/client';
import type { Pet } from '@/types/pet';
import type { Appointment, AppointmentStatus, CreateAppointmentDto } from '@/types/appointment';
import { listPets } from '@/services/pet';
import { createAppointment, updateAppointment, HttpError } from '@/services/appointments';
import ClientSearch from '@/components/molecules/ClientSearch';
import DateTimePicker from '@/components/molecules/DateTimePicker';

export interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** Called after a successful update so the page can refetch. */
  onUpdated?: () => void;
  /** When provided, the modal operates in edit/view mode. Absent = create mode. */
  appointment?: Appointment;
  workStartTime?: string;
  workEndTime?: string;
}

// ── Status transition rules (Spec: appointment-calendar-frontend §Status Transition Rules) ──

/** Status options shown in the dropdown for each current status. */
const STATUS_OPTIONS: Record<number, AppointmentStatus[]> = {
  0: [0, 1, 2],       // pending → pending, confirmed, completed
  1: [1, 2],           // confirmed → confirmed, completed
};

// ── Helpers ──────────────────────────────────────────────────────────────

function parseScheduledAt(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const year = String(d.getUTCFullYear());
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

const VIEW_ONLY_STATUSES: ReadonlySet<AppointmentStatus> = new Set([2, 3]);

/**
 * Multi-mode modal for creating, editing, and viewing appointments.
 *
 * Create mode  (appointment absent):   ClientSearch → pet select → DateTimePicker → notes → save.
 * Edit mode    (appointment present, status 0/1): pre-filled fields, pet readonly, status selector.
 * View mode    (appointment present, status 2/3): all fields disabled, Close button only.
 */
export default function AppointmentModal({
  isOpen,
  onClose,
  onCreated,
  onUpdated,
  appointment,
  workStartTime = '08:00',
  workEndTime = '18:00',
}: AppointmentModalProps) {
  const { t } = useTranslation('appointments');

  // ── Derive mode ──
  const isEdit = appointment !== undefined && !VIEW_ONLY_STATUSES.has(appointment.status);
  const isViewOnly = appointment !== undefined && VIEW_ONLY_STATUSES.has(appointment.status);
  const apptStatus = appointment?.status;

  // ── Form state ──
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [petsLoading, setPetsLoading] = useState(false);

  // ── Pre-fill from appointment on open ──
  useEffect(() => {
    if (isOpen && appointment) {
      setSelectedStatus(appointment.status);
      setNotes(appointment.notes ?? '');
      const { date: d, time: t } = parseScheduledAt(appointment.scheduledAt);
      setDate(d);
      setTime(t);
    }
  }, [isOpen, appointment]);

  // ── Reset form on close ──
  const resetForm = useCallback(() => {
    setSelectedClient(null);
    setPets([]);
    setSelectedPetId('');
    setDate('');
    setTime('');
    setNotes('');
    setSelectedStatus(0);
    setError(null);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Load pets when client changes (create mode only)
  useEffect(() => {
    if (!selectedClient) {
      setPets([]);
      setSelectedPetId('');
      return;
    }

    let cancelled = false;

    async function loadPets() {
      setPetsLoading(true);
      try {
        const result = await listPets(1, 100, selectedClient!.id);
        if (!cancelled) {
          setPets(result.data);
        }
      } catch {
        if (!cancelled) {
          setPets([]);
        }
      } finally {
        if (!cancelled) {
          setPetsLoading(false);
        }
      }
    }

    loadPets();

    return () => {
      cancelled = true;
    };
  }, [selectedClient]);

  // ── Field locking ──
  const isConfirmed = apptStatus === 1;

  const handleEditSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const dto: Record<string, unknown> = {};

      if (!isConfirmed) {
        if (date && time) {
          dto.scheduledAt = `${date}T${time}:00.000Z`;
        }
        dto.status = selectedStatus;
      }
      dto.notes = notes.trim() || null;

      await updateAppointment(appointment!.id, dto);
      onUpdated?.();
      onClose();
    } catch (err) {
      if (err instanceof HttpError && err.statusCode === 409) {
        setError(t('errors.doubleBooking'));
      } else if (err instanceof HttpError && err.statusCode === 404) {
        setError(t('errors.petNotFound'));
      } else {
        setError(t('errors.updateFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async () => {
    setError(null);
    if (!selectedClient) { setError(t('form.clientRequired')); return; }
    if (!selectedPetId) { setError(t('form.petRequired')); return; }
    if (!date) { setError(t('form.dateRequired')); return; }
    if (!time) { setError(t('form.timeRequired')); return; }

    const scheduledAt = `${date}T${time}:00.000Z`;
    setIsSubmitting(true);

    try {
      const dto: CreateAppointmentDto = {
        petId: selectedPetId as number,
        scheduledAt,
        notes: notes.trim() || undefined,
      };
      await createAppointment(dto);
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof HttpError && err.statusCode === 409) {
        setError(t('errors.doubleBooking'));
      } else if (err instanceof HttpError && err.statusCode === 404) {
        setError(t('errors.petNotFound'));
      } else {
        setError(t('errors.createFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      handleEditSubmit();
    } else {
      handleCreateSubmit();
    }
  };

  if (!isOpen) return null;

  // ── Pet field placeholder text (create mode only) ──
  let placeholderText = '--';
  if (petsLoading) {
    placeholderText = '...';
  } else if (pets.length === 0) {
    placeholderText = t('form.noPetsFound');
  }

  // ── Status options for edit mode ──
  const statusOptions = apptStatus !== undefined ? (STATUS_OPTIONS[apptStatus] ?? []) : [];

  const isFieldDisabled = isViewOnly || isConfirmed;
  let saveButtonLabel = t('form.save');
  if (isEdit) saveButtonLabel = t('form.saveUpdate');
  if (isSubmitting) saveButtonLabel = '...';
  const showSaveButton = !isViewOnly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative mx-4 w-full max-w-lg rounded-xl bg-surface-container-high p-6 shadow-xl"
        data-testid={isEdit || isViewOnly ? 'appointment-edit-modal' : undefined}
      >
        <h2 className="mb-6 font-headline text-headline-md text-on-surface">
          {isEdit || isViewOnly ? t('form.editTitle') : t('form.title')}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ── Client Search (create mode only) ── */}
          {!appointment && (
            <ClientSearch
              onSelect={(client) => {
                setSelectedClient(client);
                setSelectedPetId('');
              }}
              selectedClientId={selectedClient?.id}
            />
          )}

          {/* ── Pet field ── */}
          {appointment ? (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="appointment-pet-field"
                className="font-label text-label-sm text-on-surface-variant"
              >
                {t('form.selectPet')}
              </label>
              <input
                id="appointment-pet-field"
                data-testid="appointment-pet-field"
                type="text"
                value={appointment.petName}
                readOnly
                disabled
                aria-readonly
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body text-body-md text-on-surface focus:outline-none disabled:opacity-50"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="pet-select"
                className="font-label text-label-sm text-on-surface-variant"
              >
                {t('form.selectPet')}
              </label>
              <select
                id="pet-select"
                value={selectedPetId}
                onChange={(e) =>
                  setSelectedPetId(e.target.value ? Number(e.target.value) : '')
                }
                disabled={pets.length === 0 || petsLoading}
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                <option value="">{placeholderText}</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} ({pet.species})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Date & Time ── */}
          <DateTimePicker
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            workStartTime={workStartTime}
            workEndTime={workEndTime}
            disabled={isFieldDisabled}
          />

          {/* ── Status selector (edit mode only, non-view-only) ── */}
          {isEdit && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="appointment-status"
                className="font-label text-label-sm text-on-surface-variant"
              >
                {t('form.statusLabel')}
              </label>
              <select
                id="appointment-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(Number(e.target.value) as AppointmentStatus)}
                disabled={isConfirmed}
                aria-label={t('form.statusLabel')}
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {t(`status.${STATUS_LABEL_MAP[opt]}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Notes ── */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="appointment-notes"
              className="font-label text-label-sm text-on-surface-variant"
            >
              {t('form.notes')}
            </label>
            <textarea
              id="appointment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={isViewOnly}
              placeholder={isViewOnly ? undefined : t('form.notesPlaceholder')}
              aria-disabled={isViewOnly}
              className="resize-none rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
            <span className="text-right font-label text-label-sm text-on-surface-variant">
              {notes.length}/500
            </span>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="rounded-lg bg-error-container px-3 py-2 font-label text-label-sm text-on-error-container">
              {error}
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-2">
            {/* Create/edit: "Cancel" button → onClose */}
            {!isViewOnly && (
              <button
                type="button"
                onClick={onClose}
                data-testid="appointment-modal-cancel"
                className="rounded-lg border border-outline-variant px-4 py-2 font-label text-label-md text-on-surface-variant transition-colors hover:bg-secondary-container"
              >
                {t('form.cancel')}
              </button>
            )}
            {/* View-only: "Close" button → onClose */}
            {isViewOnly && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-outline-variant px-4 py-2 font-label text-label-md text-on-surface-variant transition-colors hover:bg-secondary-container"
              >
                {t('form.close')}
              </button>
            )}
            {showSaveButton && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-primary px-4 py-2 font-label text-label-md text-on-primary shadow-sm transition-colors hover:bg-surface-tint disabled:opacity-50"
              >
                {saveButtonLabel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_LABEL_MAP: Record<AppointmentStatus, string> = {
  0: 'pending',
  1: 'confirmed',
  2: 'completed',
  3: 'cancelled',
};