import { useTranslation } from 'react-i18next';
import type { Appointment, AppointmentStatus } from '@/types/appointment';

export interface AppointmentCardProps {
  appointment: Appointment;
  onClick: (appointment: Appointment) => void;
}

const STATUS_CLASSES: Record<AppointmentStatus, string> = {
  0: 'bg-status-warning/15 text-status-warning',    // pending = amber
  1: 'bg-status-success/15 text-status-success',     // confirmed = green
  2: 'bg-primary/15 text-primary',                    // completed = teal
  3: 'bg-status-error/15 text-status-error',          // cancelled = red
};

/**
 * Appointment card rendered inside a calendar grid slot.
 * Shows pet name, client name, time, and a status badge.
 * Clicking opens the edit modal via the onClick callback.
 */
export default function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const { t } = useTranslation('appointments');

  const scheduledDate = new Date(appointment.scheduledAt);
  const hours = String(scheduledDate.getUTCHours()).padStart(2, '0');
  const minutes = String(scheduledDate.getUTCMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  return (
    <button
      type="button"
      onClick={() => onClick(appointment)}
      className="w-full rounded-lg border-l-4 border-primary bg-surface-container-low p-2 text-left shadow-sm transition-colors hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/30"
      data-testid="appointment-card"
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate font-label text-label-sm font-semibold text-on-surface">
          {appointment.petName}
        </span>
        <span className="shrink-0 font-mono text-xs text-on-surface-variant">
          {time}
        </span>
      </div>
      <div className="mt-0.5 truncate text-xs text-on-surface-variant">
        {appointment.clientName}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_CLASSES[appointment.status]}`}
        >
          {t(`status.${STATUS_MAP[appointment.status]}`)}
        </span>
        {appointment.notes && (
          <span className="truncate text-[10px] text-on-surface-variant/60">
            {appointment.notes.slice(0, 30)}
            {appointment.notes.length > 30 ? '…' : ''}
          </span>
        )}
      </div>
    </button>
  );
}

const STATUS_MAP: Record<AppointmentStatus, string> = {
  0: 'pending',
  1: 'confirmed',
  2: 'completed',
  3: 'cancelled',
};
