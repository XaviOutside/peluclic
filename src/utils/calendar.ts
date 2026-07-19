/**
 * Pure calendar utility functions.
 * All functions work with UTC dates to avoid timezone issues.
 */

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns the Monday 00:00:00.000 UTC of the week containing `date`.
 * If `date` is a Sunday, returns the NEXT Monday (prefer future over past week).
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Monday offset: Monday=0, Tuesday=-1, ..., Sunday=-6 (→ next Monday)
  // For Sunday, go forward 1 day to next Monday. For other days, go back to Monday.
  const diff = day === 0 ? 1 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the Sunday 23:59:59.999 UTC of the week containing `date`.
 */
export function getWeekEnd(date: Date): Date {
  const d = getWeekStart(date);
  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Returns an array of 7 Date objects representing Mon–Sun of the week containing `date`.
 */
export function getWeekDays(date: Date): Date[] {
  const monday = getWeekStart(date);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * Returns a new Date offset by `n` weeks from `date`.
 * Positive n = forward, negative n = backward.
 */
export function addWeeks(date: Date, n: number): Date {
  return new Date(date.getTime() + n * MS_PER_WEEK);
}

/**
 * Formats a week range as a human-readable label.
 * Examples:
 *   - Same month: "Jul 20 – Jul 26, 2026"
 *   - Cross month: "Jul 27 – Aug 2, 2026"
 *   - Cross year: "Dec 28, 2026 – Jan 3, 2027"
 */
export function formatWeekLabel(start: Date, end: Date): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const sMonth = start.getUTCMonth();
  const sYear = start.getUTCFullYear();
  const eMonth = end.getUTCMonth();
  const eYear = end.getUTCFullYear();

  const startLabel = `${monthNames[sMonth]} ${start.getUTCDate()}`;
  const endLabel = `${monthNames[eMonth]} ${end.getUTCDate()}`;

  if (sYear !== eYear) {
    return `${startLabel}, ${sYear} – ${endLabel}, ${eYear}`;
  }

  if (sMonth !== eMonth) {
    return `${startLabel} – ${endLabel}, ${eYear}`;
  }

  return `${startLabel} – ${endLabel}, ${eYear}`;
}

/**
 * Generates time slot labels ("HH:MM") from `start` to `end` inclusive
 * at `intervalMinutes` intervals.
 *
 * Throws if intervalMinutes <= 0.
 */
export function getTimeSlots(
  start: string,
  end: string,
  intervalMinutes: number,
): string[] {
  if (intervalMinutes <= 0) {
    throw new Error('intervalMinutes must be positive');
  }

  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  const slots: string[] = [];
  for (let mins = startTotal; mins <= endTotal; mins += intervalMinutes) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  return slots;
}
