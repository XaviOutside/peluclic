/**
 * Tests for CalendarWeek component.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CalendarWeek from './CalendarWeek';
import type { Appointment } from '@/types/appointment';
import type { CompanySettings } from '@/types/settings';

const mockSettings: CompanySettings = {
  id: 1,
  companyName: 'Test Co',
  tagline: null,
  workdays: [1, 2, 3, 4, 5],
  workStartTime: '08:00',
  workEndTime: '18:00',
  defaultLang: 0,
  logoUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockAppointments: Appointment[] = [
  {
    id: 1,
    petId: 7,
    petName: 'Max',
    clientId: 42,
    clientName: 'Maria',
    scheduledAt: '2026-07-20T10:00:00.000Z',
    status: 0,
    notes: null,
    createdAt: '2026-07-19T10:00:00.000Z',
    updatedAt: '2026-07-19T10:00:00.000Z',
  },
];

const weekStart = new Date('2026-07-20T00:00:00.000Z');

describe('CalendarWeek', () => {
  it('renders 7 day columns', () => {
    render(
      <CalendarWeek
        appointments={mockAppointments}
        weekStart={weekStart}
        onPrevWeek={vi.fn()}
        onNextWeek={vi.fn()}
        onAppointmentClick={vi.fn()}
        settings={mockSettings}
      />,
    );

    // Day labels: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    expect(screen.getByText('days.mon')).toBeInTheDocument();
    expect(screen.getByText('days.tue')).toBeInTheDocument();
    expect(screen.getByText('days.wed')).toBeInTheDocument();
    expect(screen.getByText('days.thu')).toBeInTheDocument();
    expect(screen.getByText('days.fri')).toBeInTheDocument();
    expect(screen.getByText('days.sat')).toBeInTheDocument();
    expect(screen.getByText('days.sun')).toBeInTheDocument();
  });

  it('shows week label', () => {
    render(
      <CalendarWeek
        appointments={mockAppointments}
        weekStart={weekStart}
        onPrevWeek={vi.fn()}
        onNextWeek={vi.fn()}
        onAppointmentClick={vi.fn()}
        settings={mockSettings}
      />,
    );

    expect(screen.getByText(/Jul 20/)).toBeInTheDocument();
  });

  it('renders appointment cards', () => {
    render(
      <CalendarWeek
        appointments={mockAppointments}
        weekStart={weekStart}
        onPrevWeek={vi.fn()}
        onNextWeek={vi.fn()}
        onAppointmentClick={vi.fn()}
        settings={mockSettings}
      />,
    );

    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  it('calls onPrevWeek when previous is clicked', () => {
    const onPrev = vi.fn();
    render(
      <CalendarWeek
        appointments={[]}
        weekStart={weekStart}
        onPrevWeek={onPrev}
        onNextWeek={vi.fn()}
        onAppointmentClick={vi.fn()}
        settings={mockSettings}
      />,
    );

    // Find the previous button
    const buttons = screen.getAllByRole('button');
    const prevBtn = buttons.find((b) =>
      b.textContent?.includes('chevron_left') || b.getAttribute('aria-label')?.includes('previous'),
    );
    if (prevBtn) fireEvent.click(prevBtn);
    expect(onPrev).toHaveBeenCalled();
  });

  it('calls onNextWeek when next is clicked', () => {
    const onNext = vi.fn();
    render(
      <CalendarWeek
        appointments={[]}
        weekStart={weekStart}
        onPrevWeek={vi.fn()}
        onNextWeek={onNext}
        onAppointmentClick={vi.fn()}
        settings={mockSettings}
      />,
    );

    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons.find((b) =>
      b.textContent?.includes('chevron_right') || b.getAttribute('aria-label')?.includes('next'),
    );
    if (nextBtn) fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalled();
  });

  it('shows empty state when no appointments', () => {
    render(
      <CalendarWeek
        appointments={[]}
        weekStart={weekStart}
        onPrevWeek={vi.fn()}
        onNextWeek={vi.fn()}
        onAppointmentClick={vi.fn()}
        settings={mockSettings}
      />,
    );

    expect(screen.getByText('noAppointments')).toBeInTheDocument();
  });
});
