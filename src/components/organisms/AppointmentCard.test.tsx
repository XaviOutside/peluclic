/**
 * Tests for AppointmentCard component.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AppointmentCard from './AppointmentCard';
import type { Appointment } from '@/types/appointment';

const mockAppointment: Appointment = {
  id: 1,
  petId: 7,
  petName: 'Max',
  clientId: 42,
  clientName: 'Maria Garcia',
  scheduledAt: '2026-07-20T14:00:00.000Z',
  status: 0,
  notes: 'First visit — check for matting',
  createdAt: '2026-07-19T10:00:00.000Z',
  updatedAt: '2026-07-19T10:00:00.000Z',
};

describe('AppointmentCard', () => {
  it('renders pet name and client name', () => {
    render(
      <AppointmentCard appointment={mockAppointment} onClick={vi.fn()} />,
    );

    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
  });

  it('shows the appointment time in UTC', () => {
    render(
      <AppointmentCard appointment={mockAppointment} onClick={vi.fn()} />,
    );

    // 14:00 UTC displayed as 14:00
    expect(screen.getByText('14:00')).toBeInTheDocument();
  });

  it('renders a status badge with translated label', () => {
    render(
      <AppointmentCard appointment={mockAppointment} onClick={vi.fn()} />,
    );

    // i18n mock returns keys as values ("status.pending")
    expect(screen.getByText('status.pending')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <AppointmentCard appointment={mockAppointment} onClick={handleClick} />,
    );

    fireEvent.click(screen.getByTestId('appointment-card'));
    expect(handleClick).toHaveBeenCalledWith(mockAppointment);
  });

  it('shows truncated notes when present', () => {
    render(
      <AppointmentCard appointment={mockAppointment} onClick={vi.fn()} />,
    );

    // Notes text is split across elements (text + ellipsis)
    // Verify the first 20 chars are present
    expect(
      screen.getByText(/First visit/),
    ).toBeInTheDocument();
  });

  it('does not show notes section when notes is null', () => {
    const noNotes = { ...mockAppointment, notes: null };
    render(
      <AppointmentCard appointment={noNotes} onClick={vi.fn()} />,
    );

    // Notes span should not be rendered
    const notesEl = document.querySelector('[data-testid="appointment-card"] .text-on-surface-variant\\/60');
    expect(notesEl).toBeNull();
  });
});
