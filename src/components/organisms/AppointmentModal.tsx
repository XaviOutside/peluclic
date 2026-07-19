import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Client } from '@/types/client';
import type { Pet } from '@/types/pet';
import type { CreateAppointmentDto } from '@/types/appointment';
import { listPets } from '@/services/pet';
import { createAppointment, HttpError } from '@/services/appointments';
import ClientSearch from '@/components/molecules/ClientSearch';
import DateTimePicker from '@/components/molecules/DateTimePicker';

export interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  workStartTime?: string;
  workEndTime?: string;
}

/**
 * Multi-step modal for creating a new appointment.
 * Flow: ClientSearch → pet dropdown → DateTimePicker → notes → submit.
 * Uses native <dialog>-like overlay with Tailwind — zero external modal deps.
 */
export default function AppointmentModal({
  isOpen,
  onClose,
  onCreated,
  workStartTime = '08:00',
  workEndTime = '18:00',
}: AppointmentModalProps) {
  const { t } = useTranslation('appointments');

  // Form state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [petsLoading, setPetsLoading] = useState(false);

  // Load pets when client changes
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

  // Reset form on close or when modal reopens
  const resetForm = useCallback(() => {
    setSelectedClient(null);
    setPets([]);
    setSelectedPetId('');
    setDate('');
    setTime('');
    setNotes('');
    setError(null);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedClient) {
      setError(t('form.clientRequired'));
      return;
    }
    if (!selectedPetId) {
      setError(t('form.petRequired'));
      return;
    }
    if (!date) {
      setError(t('form.dateRequired'));
      return;
    }
    if (!time) {
      setError(t('form.timeRequired'));
      return;
    }

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-lg rounded-xl bg-surface-container-high p-6 shadow-xl">
        <h2 className="mb-6 font-headline text-headline-md text-on-surface">
          {t('form.title')}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ── Client Search ── */}
          <ClientSearch
            onSelect={(client) => {
              setSelectedClient(client);
              setSelectedPetId('');
            }}
            selectedClientId={selectedClient?.id}
          />

          {/* ── Pet Select ── */}
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
              <option value="">
                {petsLoading
                  ? '...'
                  : pets.length === 0
                    ? t('form.noPetsFound')
                    : '--'}
              </option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.species})
                </option>
              ))}
            </select>
          </div>

          {/* ── Date & Time ── */}
          <DateTimePicker
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            workStartTime={workStartTime}
            workEndTime={workEndTime}
          />

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
              placeholder={t('form.notesPlaceholder')}
              className="resize-none rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-outline-variant px-4 py-2 font-label text-label-md text-on-surface-variant transition-colors hover:bg-secondary-container"
            >
              {t('form.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 font-label text-label-md text-on-primary shadow-sm transition-colors hover:bg-surface-tint disabled:opacity-50"
            >
              {isSubmitting ? '...' : t('form.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
