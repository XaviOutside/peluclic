import { useTranslation } from 'react-i18next';
import { getTimeSlots } from '@/utils/calendar';

export interface DateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  workStartTime?: string;
  workEndTime?: string;
}

/**
 * Native date input + time select with 30-min increments.
 * Time slots constrained to business hours (default 08:00–18:00).
 * Zero external dependencies.
 */
export default function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  workStartTime = '08:00',
  workEndTime = '18:00',
}: DateTimePickerProps) {
  const { t } = useTranslation('appointments');
  const slots = getTimeSlots(workStartTime, workEndTime, 30);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
      <div className="flex flex-1 flex-col gap-1">
        <label
          htmlFor="appointment-date"
          className="font-label text-label-sm text-on-surface-variant"
        >
          {t('form.date')}
        </label>
        <input
          id="appointment-date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <label
          htmlFor="appointment-time"
          className="font-label text-label-sm text-on-surface-variant"
        >
          {t('form.time')}
        </label>
        <select
          id="appointment-time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="" disabled>
            --:--
          </option>
          {slots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
