import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Appointment } from '@/types/appointment';
import type { CompanySettings } from '@/types/settings';
import { getSettings } from '@/services/settings';
import { listAppointments } from '@/services/appointments';
import CalendarWeek from '@/components/organisms/CalendarWeek';
import AppointmentModal from '@/components/organisms/AppointmentModal';
import { getWeekStart, addWeeks } from '@/utils/calendar';

export default function AppointmentsPage() {
  const { t } = useTranslation(['appointments', 'common']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Week state — derived from ?week= URL param or today
  const weekParam = searchParams.get('week');
  const initialWeekStart = weekParam
    ? getWeekStart(new Date(`${weekParam}T00:00:00.000Z`))
    : getWeekStart(new Date());

  const [weekStart, setWeekStart] = useState<Date>(initialWeekStart);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch settings
  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const s = await getSettings();
        if (!cancelled) setSettings(s);
      } catch {
        // Fallback: default business hours used in CalendarWeek
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch appointments for the current week
  const fetchAppointments = useCallback(async (start: Date) => {
    setIsLoading(true);
    setError(null);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);

    try {
      const data = await listAppointments(
        start.toISOString().slice(0, 10),
        end.toISOString().slice(0, 10),
      );
      setAppointments(data);
    } catch {
      setError(t('appointments:errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Initial fetch
  useEffect(() => {
    fetchAppointments(weekStart);
  }, [weekStart, fetchAppointments]);

  // Week navigation
  const goToWeek = useCallback(
    (offset: number) => {
      const newStart = addWeeks(weekStart, offset);
      setWeekStart(newStart);

      const weekStr = newStart.toISOString().slice(0, 10);
      navigate(`/calendar?week=${weekStr}`, { replace: true });
    },
    [weekStart, navigate],
  );

  const handlePrevWeek = () => goToWeek(-1);
  const handleNextWeek = () => goToWeek(1);

  const handleAppointmentClick = (appointment: Appointment) => {
    // For v1, clicking opens the modal (view-only would be phase 2)
    setIsModalOpen(true);
  };

  const handleModalCreated = () => {
    fetchAppointments(weekStart);
  };

  // Handle Sidebar "New Appointment" — exposed via a global event or prop
  // For simplicity, we listen for a custom event dispatched by the sidebar
  useEffect(() => {
    function handleOpenModal() {
      setIsModalOpen(true);
    }

    window.addEventListener('open-appointment-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-appointment-modal', handleOpenModal);
    };
  }, []);

  const defaultSettings: CompanySettings = {
    id: 0,
    companyName: '',
    tagline: null,
    workdays: [1, 2, 3, 4, 5],
    workStartTime: '08:00',
    workEndTime: '18:00',
    defaultLang: 0,
    logoUrl: null,
    createdAt: '',
    updatedAt: '',
  };

  const activeSettings = settings || defaultSettings;

  return (
    <div className="flex flex-col gap-6" data-testid="appointments-page">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-headline-xl text-on-surface">
          {t('appointments:title')}
        </h1>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label text-label-md text-on-primary shadow-sm transition-colors hover:bg-surface-tint"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            add
          </span>
          {t('appointments:newAppointment')}
        </button>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <p className="font-body text-body-lg text-on-surface-variant">
            Loading...
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {error && !isLoading && (
        <div
          className="rounded-lg bg-error-container px-4 py-3 font-label text-label-md text-on-error-container"
          role="alert"
        >
          {error}
          <button
            type="button"
            onClick={() => fetchAppointments(weekStart)}
            className="ml-3 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Calendar ── */}
      {!isLoading && !error && (
        <CalendarWeek
          appointments={appointments}
          weekStart={weekStart}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onAppointmentClick={handleAppointmentClick}
          settings={activeSettings}
        />
      )}

      {/* ── Modal ── */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleModalCreated}
        workStartTime={activeSettings.workStartTime}
        workEndTime={activeSettings.workEndTime}
      />
    </div>
  );
}
