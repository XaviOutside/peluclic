/**
 * Tests for AppointmentsPage — edit and cancel appointment wiring.
 * Covers: card click → edit modal, cancel icon → confirm dialog,
 * mutation wiring, refetch after mutations, create-mode regression.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Appointment } from '@/types/appointment';
import AppointmentsPage from './AppointmentsPage';

// ── Mock data ──────────────────────────────────────────────────────────

const mockAppointment: Appointment = {
  id: 1,
  petId: 7,
  petName: 'Max',
  clientId: 42,
  clientName: 'Maria Garcia',
  scheduledAt: '2026-07-20T10:00:00.000Z',
  status: 0,
  notes: 'Test notes',
  createdAt: '2026-07-19T10:00:00.000Z',
  updatedAt: '2026-07-19T10:00:00.000Z',
};

// ── Hoisted mocks ──────────────────────────────────────────────────────

const {
  mockNavigate,
  mockCancelMutate,
  mockListAppointments,
  mockGetSettings,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockCancelMutate: vi.fn().mockResolvedValue(undefined),
  mockListAppointments: vi.fn(),
  mockGetSettings: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/services/settings', () => ({
  getSettings: () => mockGetSettings(),
}));

vi.mock('@/services/appointments', () => ({
  listAppointments: (...args: unknown[]) => mockListAppointments(...args),
  HttpError: class HttpError extends Error {
    statusCode = 500;
  },
}));

vi.mock('@/hooks/useAppointmentMutations', () => ({
  useUpdateAppointment: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
    reset: vi.fn(),
  }),
  useCancelAppointment: () => ({
    mutate: mockCancelMutate,
    isLoading: false,
    error: null,
    reset: vi.fn(),
  }),
}));

// ── Helpers ────────────────────────────────────────────────────────────

function renderPage(initialPath = '/calendar') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppointmentsPage />
    </MemoryRouter>,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('AppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue({
      id: 1,
      companyName: 'Test',
      tagline: null,
      workdays: [1, 2, 3, 4, 5],
      workStartTime: '08:00',
      workEndTime: '18:00',
      defaultLang: 0,
      logoUrl: null,
      createdAt: '',
      updatedAt: '',
    });
    mockListAppointments.mockResolvedValue([mockAppointment]);
  });

  // ── Basic rendering ─────────────────────────────────────────────────

  it('renders the calendar with appointments loaded from API', async () => {
    renderPage('/calendar?week=2026-07-20');

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });
    expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
    expect(screen.getByText('appointments:title')).toBeInTheDocument();
  });

  it('renders the New Appointment button', async () => {
    renderPage('/calendar?week=2026-07-20');

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    expect(screen.getByText('appointments:newAppointment')).toBeInTheDocument();
  });

  // ── Edit modal via card click ───────────────────────────────────────

  it('opens the modal in edit mode when an appointment card is clicked', async () => {
    renderPage('/calendar?week=2026-07-20');

    await waitFor(() => {
      expect(screen.getByTestId('appointment-card')).toBeInTheDocument();
    });

    // Click the card to open edit modal
    fireEvent.click(screen.getByTestId('appointment-card'));

    // Edit modal should appear with the edit title
    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });

    // Edit modal wrapper has the edit testid
    expect(screen.getByTestId('appointment-edit-modal')).toBeInTheDocument();
  });

  it('pre-fills the pet field in edit mode as readonly', async () => {
    renderPage('/calendar?week=2026-07-20');

    await waitFor(() => {
      expect(screen.getByTestId('appointment-card')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('appointment-card'));

    await waitFor(() => {
      expect(screen.getByTestId('appointment-pet-field')).toBeInTheDocument();
    });

    const petField = screen.getByTestId('appointment-pet-field');
    expect(petField).toHaveValue('Max');
    expect(petField).toHaveAttribute('readonly');
  });

  // ── Create mode via New Appointment button (regression) ─────────────

  it('opens the modal in create mode via the New Appointment button', async () => {
    renderPage('/calendar?week=2026-07-20');

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    // Click the New Appointment button
    fireEvent.click(screen.getByText('appointments:newAppointment'));

    // Create modal shows a different title (not edit)
    await waitFor(() => {
      expect(screen.getByText('form.title')).toBeInTheDocument();
    });

    // No edit testid on the modal wrapper
    expect(screen.queryByTestId('appointment-edit-modal')).toBeNull();
  });

  // ── Cancel appointment flow ─────────────────────────────────────────

  it('opens confirm dialog when cancel icon is clicked on a card', async () => {
    renderPage('/calendar?week=2026-07-20');

    await waitFor(() => {
      expect(screen.getByTestId('appointment-card')).toBeInTheDocument();
    });

    // Click the cancel icon
    fireEvent.click(screen.getByTestId('appointment-cancel-icon'));

    // ConfirmDialog should appear
    await waitFor(() => {
      // The ConfirmDialog uses Modal atom which renders role="dialog"
      const dialogs = screen.getAllByRole('dialog');
      // At least one dialog should contain the cancel title
      expect(
        dialogs.some((d) => d.textContent?.includes('appointments:cancel.title')),
      ).toBe(true);
    });
  });

  it('confirming cancel calls the cancel mutation and refetches appointments', async () => {
    renderPage('/calendar?week=2026-07-20');

    await waitFor(() => {
      expect(screen.getByTestId('appointment-card')).toBeInTheDocument();
    });

    // Open cancel dialog
    fireEvent.click(screen.getByTestId('appointment-cancel-icon'));

    // Wait for the confirm button
    await waitFor(() => {
      expect(screen.getByText('actions.confirm')).toBeInTheDocument();
    });

    // Store initial call count
    const initialCallCount = mockListAppointments.mock.calls.length;

    // Click confirm
    fireEvent.click(screen.getByText('actions.confirm'));

    await waitFor(() => {
      expect(mockCancelMutate).toHaveBeenCalledWith(1);
    });

    // Refetch should have occurred (one more call)
    await waitFor(() => {
      expect(mockListAppointments.mock.calls.length).toBe(initialCallCount + 1);
    });
  });

  it('dismissing the cancel dialog does not call the mutation', async () => {
    renderPage('/calendar?week=2026-07-20');

    await waitFor(() => {
      expect(screen.getByTestId('appointment-card')).toBeInTheDocument();
    });

    // Open cancel dialog
    fireEvent.click(screen.getByTestId('appointment-cancel-icon'));

    await waitFor(() => {
      expect(screen.getByText('actions.cancel')).toBeInTheDocument();
    });

    // Click the secondary cancel button in the dialog
    fireEvent.click(screen.getByText('actions.cancel'));

    // Mutation should NOT have been called
    expect(mockCancelMutate).not.toHaveBeenCalled();
  });

  it('close from modal does not leave stale cancel target', async () => {
    renderPage('/calendar?week=2026-07-20');

    await waitFor(() => {
      expect(screen.getByTestId('appointment-card')).toBeInTheDocument();
    });

    // Open edit modal via card click
    fireEvent.click(screen.getByTestId('appointment-card'));

    await waitFor(() => {
      expect(screen.getByText('form.editTitle')).toBeInTheDocument();
    });

    // Close the modal
    fireEvent.click(screen.getByText('form.cancel'));

    // Modal should close — edit title gone
    await waitFor(() => {
      expect(screen.queryByText('form.editTitle')).toBeNull();
    });

    // New Appointment button should still open create mode (not stuck in edit)
    fireEvent.click(screen.getByText('appointments:newAppointment'));

    await waitFor(() => {
      expect(screen.getByText('form.title')).toBeInTheDocument();
    });
  });
});
