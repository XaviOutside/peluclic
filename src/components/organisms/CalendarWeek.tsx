import { useTranslation } from 'react-i18next';
import type { Appointment } from '@/types/appointment';
import type { CompanySettings } from '@/types/settings';
import AppointmentCard from '@/components/organisms/AppointmentCard';
import { getWeekDays, getWeekEnd, formatWeekLabel, getTimeSlots } from '@/utils/calendar';

export interface CalendarWeekProps {
  appointments: Appointment[];
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onAppointmentClick: (appointment: Appointment) => void;
  settings: CompanySettings;
}

/**
 * CSS Grid weekly calendar: 7 columns (Mon–Sun) × time slot rows.
 * Time slots constrained to settings workStartTime/workEndTime.
 * Zero external calendar dependencies.
 */
export default function CalendarWeek({
  appointments,
  weekStart,
  onPrevWeek,
  onNextWeek,
  onAppointmentClick,
  settings,
}: CalendarWeekProps) {
  const { t } = useTranslation('appointments');

  const weekEnd = getWeekEnd(weekStart);
  const days = getWeekDays(weekStart);
  const weekLabel = formatWeekLabel(weekStart, weekEnd);

  const workStart = settings.workStartTime || '08:00';
  const workEnd = settings.workEndTime || '18:00';
  const workdays = settings.workdays.length > 0 ? settings.workdays : [1, 2, 3, 4, 5];
  const timeSlots = getTimeSlots(workStart, workEnd, 30);

  /**
   * Indexes appointments by day-of-week (0=Mon) and time slot index
   * so they can be rendered in the correct grid cell.
   */
  const getAppointmentsForSlot = (dayIndex: number, slotTime: string): Appointment[] => {
    return appointments.filter((a) => {
      const apptDate = new Date(a.scheduledAt);
      const apptDay = days.findIndex(
        (d) => d.toISOString().slice(0, 10) === apptDate.toISOString().slice(0, 10),
      );
      const hours = String(apptDate.getUTCHours()).padStart(2, '0');
      const minutes = String(apptDate.getUTCMinutes()).padStart(2, '0');
      const apptTime = `${hours}:${minutes}`;

      return apptDay === dayIndex && apptTime === slotTime;
    });
  };

  const isWorkday = (dayIndex: number): boolean => {
    // 0=Mon → 1 (ISO weekday), 6=Sun → 7
    return workdays.includes(dayIndex + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Week Navigation ── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevWeek}
          aria-label={t('nav.previous')}
          className="flex items-center gap-1 rounded-lg px-3 py-2 font-label text-label-md text-on-surface-variant transition-colors hover:bg-secondary-container"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
          {t('nav.previous')}
        </button>

        <h2 className="text-center font-headline text-headline-md text-on-surface">
          {weekLabel}
        </h2>

        <button
          type="button"
          onClick={onNextWeek}
          aria-label={t('nav.next')}
          className="flex items-center gap-1 rounded-lg px-3 py-2 font-label text-label-md text-on-surface-variant transition-colors hover:bg-secondary-container"
        >
          {t('nav.next')}
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>

      {/* ── Calendar Grid ── */}
      <div className="overflow-x-auto rounded-lg border border-outline-variant bg-surface">
        {/* Day header row */}
        <div
          className="grid border-b border-outline-variant"
          style={{ gridTemplateColumns: `repeat(7, 1fr)` }}
        >
          {days.map((day, i) => {
            const dayNum = day.getUTCDate();
            const dayName = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][i];
            const muted = !isWorkday(i);

            return (
              <div
                key={i}
                className={`border-r border-outline-variant px-3 py-2 text-center last:border-r-0 ${
                  muted ? 'bg-surface-container-low opacity-50' : ''
                }`}
              >
                <div className="font-label text-label-sm text-on-surface-variant">
                  {t(`days.${dayName}`)}
                </div>
                <div className="mt-0.5 font-headline text-headline-md text-on-surface">
                  {dayNum}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time slot rows */}
        {timeSlots.map((slotTime) => (
          <div
            key={slotTime}
            className="grid border-b border-outline-variant/30 last:border-b-0"
            style={{ gridTemplateColumns: `repeat(7, 1fr)` }}
          >
            {days.map((_, dayIndex) => {
              const slotAppts = getAppointmentsForSlot(dayIndex, slotTime);
              const muted = !isWorkday(dayIndex);

              return (
                <div
                  key={dayIndex}
                  className={`min-h-[4rem] border-r border-outline-variant/30 p-1 last:border-r-0 ${
                    muted ? 'bg-surface-container-low opacity-40' : ''
                  }`}
                >
                  {slotAppts.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appointment={appt}
                      onClick={onAppointmentClick}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {appointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">
            event_busy
          </span>
          <p className="mt-4 font-body text-body-lg text-on-surface-variant">
            {t('noAppointments')}
          </p>
        </div>
      )}
    </div>
  );
}
