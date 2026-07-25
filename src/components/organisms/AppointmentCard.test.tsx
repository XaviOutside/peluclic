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

// ── Cancel icon (Spec: appointment-calendar-frontend §AppointmentCard) ──

describe('AppointmentCard cancel icon', () => {
  it('renders cancel icon for pending appointment (status=0) when onCancel provided', () => {
    render(
      <AppointmentCard
        appointment={{ ...mockAppointment, status: 0 }}
        onClick={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId('appointment-cancel-icon')).toBeInTheDocument();
  });

  it('renders cancel icon for confirmed appointment (status=1) when onCancel provided', () => {
    render(
      <AppointmentCard
        appointment={{ ...mockAppointment, status: 1 }}
        onClick={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId('appointment-cancel-icon')).toBeInTheDocument();
  });

  it('hides cancel icon for completed appointment (status=2)', () => {
    render(
      <AppointmentCard
        appointment={{ ...mockAppointment, status: 2 }}
        onClick={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('appointment-cancel-icon')).toBeNull();
  });

  it('hides cancel icon for cancelled appointment (status=3)', () => {
    render(
      <AppointmentCard
        appointment={{ ...mockAppointment, status: 3 }}
        onClick={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('appointment-cancel-icon')).toBeNull();
  });

  it('does not render cancel icon when onCancel prop is absent (backward compat)', () => {
    render(
      <AppointmentCard
        appointment={{ ...mockAppointment, status: 0 }}
        onClick={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('appointment-cancel-icon')).toBeNull();
  });

  it('clicking cancel icon calls onCancel, not onClick', () => {
    const handleCancel = vi.fn();
    const handleClick = vi.fn();

    render(
      <AppointmentCard
        appointment={mockAppointment}
        onClick={handleClick}
        onCancel={handleCancel}
      />,
    );

    fireEvent.click(screen.getByTestId('appointment-cancel-icon'));

    expect(handleCancel).toHaveBeenCalledWith(mockAppointment);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('cancel icon click stopPropagation prevents card onClick', () => {
    const handleCancel = vi.fn();
    const handleClick = vi.fn();

    render(
      <AppointmentCard
        appointment={mockAppointment}
        onClick={handleClick}
        onCancel={handleCancel}
      />,
    );

    // Click the cancel icon — should NOT trigger card click
    fireEvent.click(screen.getByTestId('appointment-cancel-icon'));

    expect(handleClick).not.toHaveBeenCalled();
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
