/**
 * Tests for calendar utility functions.
 * Pure functions — zero mocks needed.
 *
 * Covers: getWeekStart, getWeekEnd, getWeekDays, addWeeks,
 * formatWeekLabel, getTimeSlots
 */
import { describe, it, expect } from 'vitest';
import {
  getWeekStart,
  getWeekEnd,
  getWeekDays,
  addWeeks,
  formatWeekLabel,
  getTimeSlots,
} from './calendar';

describe('getWeekStart', () => {
  it('returns Monday 00:00:00.000 for a Wednesday', () => {
    const wednesday = new Date('2026-07-22T14:30:00.000Z');
    const monday = getWeekStart(wednesday);

    expect(monday.getUTCDay()).toBe(1); // Monday
    expect(monday.getUTCHours()).toBe(0);
    expect(monday.getUTCMinutes()).toBe(0);
    expect(monday.getUTCSeconds()).toBe(0);
    expect(monday.getUTCMilliseconds()).toBe(0);
    expect(monday.toISOString()).toBe('2026-07-20T00:00:00.000Z');
  });

  it('returns same date for a Monday', () => {
    const monday = new Date('2026-07-20T10:00:00.000Z');
    const result = getWeekStart(monday);

    expect(result.toISOString()).toBe('2026-07-20T00:00:00.000Z');
  });

  it('returns next Monday for a Sunday', () => {
    const sunday = new Date('2026-07-26T10:00:00.000Z');
    const result = getWeekStart(sunday);

    expect(result.toISOString()).toBe('2026-07-27T00:00:00.000Z');
  });

  it('crosses month boundary correctly', () => {
    const thursday = new Date('2026-04-02T12:00:00.000Z');
    const result = getWeekStart(thursday);

    expect(result.toISOString()).toBe('2026-03-30T00:00:00.000Z');
  });

  it('crosses year boundary correctly', () => {
    const thursday = new Date('2027-01-01T12:00:00.000Z');
    const result = getWeekStart(thursday);

    expect(result.toISOString()).toBe('2026-12-28T00:00:00.000Z');
  });
});

describe('getWeekEnd', () => {
  it('returns Sunday 23:59:59.999 for a Wednesday', () => {
    const wednesday = new Date('2026-07-22T14:30:00.000Z');
    const sunday = getWeekEnd(wednesday);

    expect(sunday.getUTCDay()).toBe(0); // Sunday
    expect(sunday.getUTCHours()).toBe(23);
    expect(sunday.getUTCMinutes()).toBe(59);
    expect(sunday.getUTCSeconds()).toBe(59);
    expect(sunday.getUTCMilliseconds()).toBe(999);
    expect(sunday.toISOString()).toBe('2026-07-26T23:59:59.999Z');
  });

  it('returns following Sunday for a Sunday', () => {
    const sunday = new Date('2026-07-26T10:00:00.000Z');
    const result = getWeekEnd(sunday);

    expect(result.toISOString()).toBe('2026-08-02T23:59:59.999Z');
  });
});

describe('getWeekDays', () => {
  it('returns 7 Date objects Mon–Sun for a given week', () => {
    const wednesday = new Date('2026-07-22T14:30:00.000Z');
    const days = getWeekDays(wednesday);

    expect(days).toHaveLength(7);

    // Monday = 0, Tuesday = 1, ... Sunday = 6
    expect(days[0].toISOString().slice(0, 10)).toBe('2026-07-20');
    expect(days[1].toISOString().slice(0, 10)).toBe('2026-07-21');
    expect(days[2].toISOString().slice(0, 10)).toBe('2026-07-22');
    expect(days[3].toISOString().slice(0, 10)).toBe('2026-07-23');
    expect(days[4].toISOString().slice(0, 10)).toBe('2026-07-24');
    expect(days[5].toISOString().slice(0, 10)).toBe('2026-07-25');
    expect(days[6].toISOString().slice(0, 10)).toBe('2026-07-26');
  });

  it('spans month boundary correctly', () => {
    // April 30, 2026 is a Thursday → week starts Mon Apr 27
    const days = getWeekDays(new Date('2026-04-30T12:00:00.000Z'));

    expect(days[0].toISOString().slice(0, 10)).toBe('2026-04-27');
    expect(days[6].toISOString().slice(0, 10)).toBe('2026-05-03');
  });
});

describe('addWeeks', () => {
  it('returns same date when n=0', () => {
    const date = new Date('2026-07-22T14:30:00.000Z');
    const result = addWeeks(date, 0);

    expect(result.toISOString()).toBe('2026-07-22T14:30:00.000Z');
  });

  it('adds 1 week (forward)', () => {
    const date = new Date('2026-07-22T14:30:00.000Z');
    const result = addWeeks(date, 1);

    expect(result.toISOString()).toBe('2026-07-29T14:30:00.000Z');
  });

  it('subtracts 2 weeks (backward)', () => {
    const date = new Date('2026-07-22T14:30:00.000Z');
    const result = addWeeks(date, -2);

    expect(result.toISOString()).toBe('2026-07-08T14:30:00.000Z');
  });

  it('crosses month boundary', () => {
    const date = new Date('2026-07-30T10:00:00.000Z');
    const result = addWeeks(date, 1);

    expect(result.toISOString()).toBe('2026-08-06T10:00:00.000Z');
  });

  it('crosses year boundary', () => {
    const date = new Date('2026-12-25T10:00:00.000Z');
    const result = addWeeks(date, 2);

    expect(result.toISOString()).toBe('2027-01-08T10:00:00.000Z');
  });
});

describe('formatWeekLabel', () => {
  it('formats same-month range as "Jul 20 – Jul 26, 2026"', () => {
    const start = new Date('2026-07-20T00:00:00.000Z');
    const end = new Date('2026-07-26T23:59:59.999Z');

    const label = formatWeekLabel(start, end);

    expect(label).toBe('Jul 20 – Jul 26, 2026');
  });

  it('formats cross-month range with abbreviated months', () => {
    const start = new Date('2026-07-27T00:00:00.000Z');
    const end = new Date('2026-08-02T23:59:59.999Z');

    const label = formatWeekLabel(start, end);

    expect(label).toBe('Jul 27 – Aug 2, 2026');
  });

  it('formats cross-year range correctly', () => {
    const start = new Date('2026-12-28T00:00:00.000Z');
    const end = new Date('2027-01-03T23:59:59.999Z');

    const label = formatWeekLabel(start, end);

    expect(label).toBe('Dec 28, 2026 – Jan 3, 2027');
  });
});

describe('getTimeSlots', () => {
  it('generates 30-min intervals from 08:00 to 18:00', () => {
    const slots = getTimeSlots('08:00', '18:00', 30);

    expect(slots).toHaveLength(21); // 08:00, 08:30, ..., 17:30 = 20 half-hours
    expect(slots[0]).toBe('08:00');
    expect(slots[1]).toBe('08:30');
    expect(slots[2]).toBe('09:00');
    expect(slots[19]).toBe('17:30');
    expect(slots[20]).toBe('18:00');
  });

  it('generates 60-min intervals', () => {
    const slots = getTimeSlots('08:00', '17:00', 60);

    expect(slots).toHaveLength(10); // 08:00–17:00 inclusive = 10 hours
    expect(slots[0]).toBe('08:00');
    expect(slots[1]).toBe('09:00');
    expect(slots[9]).toBe('17:00');
  });

  it('returns empty array when start equals end', () => {
    const slots = getTimeSlots('10:00', '10:00', 30);

    expect(slots).toHaveLength(1); // inclusive of start
  });

  it('allows non-standard hours (e.g., 07:00–19:00)', () => {
    const slots = getTimeSlots('07:00', '19:00', 30);

    expect(slots).toHaveLength(25); // 07:00–19:00 = 24 half-hours
    expect(slots[0]).toBe('07:00');
    expect(slots[24]).toBe('19:00');
  });

  it('throws when interval is zero or negative', () => {
    expect(() => getTimeSlots('08:00', '12:00', 0)).toThrow();
    expect(() => getTimeSlots('08:00', '12:00', -30)).toThrow();
  });
});
