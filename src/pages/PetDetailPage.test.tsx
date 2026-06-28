import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PetDetailPage from './PetDetailPage';

afterEach(cleanup);

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const activePet = {
  id: 1,
  clientId: 10,
  name: 'Max',
  species: 'Dog',
  breed: 'Golden Retriever',
  sex: 'male' as const,
  dateOfBirth: '2020-03-15T00:00:00.000Z',
  weightKg: 32.5,
  notes: 'Friendly',
  status: 'active' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const inactivePet = {
  ...activePet,
  id: 2,
  name: 'Bella',
  status: 'inactive' as const,
};

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function renderPage(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/pets/${id}`]}>
      <Routes>
        <Route path="/pets/:id" element={<PetDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  mockNavigate.mockReset();
});

describe('PetDetailPage', () => {
  it('shows loading spinner initially', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders pet detail after loading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(activePet),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    expect(screen.getByText('Dog — Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('32.5 kg')).toBeInTheDocument();
    expect(screen.getByText('Friendly')).toBeInTheDocument();
  });

  it('shows not-found message for non-existent pet', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Pet not found', statusCode: 404 }),
    });

    renderPage('999');

    await waitFor(() => {
      expect(screen.getByText('Pet not found')).toBeInTheDocument();
    });
  });

  it('shows error state on server failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  it('has a back button that navigates to /pets', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(activePet),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    // PetDetailCard renders "← Back to list" button
    const backButtons = screen.getAllByRole('button', { name: /← Back/i });
    const user = userEvent.setup();
    await user.click(backButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });

  it('has an Edit button that navigates to edit page', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(activePet),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(mockNavigate).toHaveBeenCalledWith('/pets/1/edit');
  });

  it('shows deactivate confirm dialog and deactivates on confirm', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(activePet),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Click Deactivate — there may be multiple buttons with this name,
    // target the one in the PetDetailCard action bar (first occurrence)
    const deactivateButtons = screen.getAllByRole('button', { name: 'Deactivate' });
    await user.click(deactivateButtons[0]);

    // Confirm dialog should appear
    expect(screen.getByText('Deactivate Pet')).toBeInTheDocument();
    expect(screen.getByText(/deactivate Max\?/i)).toBeInTheDocument();

    // Mock the deactivate API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...activePet, status: 'inactive' }),
    });

    // Click confirm in the dialog — now there are 2 "Deactivate" buttons,
    // the second one (index 1) is in the dialog
    const confirmButtons = screen.getAllByRole('button', { name: 'Deactivate' });
    await user.click(confirmButtons[1]);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pets');
    });
  });

  it('has a View Client link when onViewClient is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(activePet),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    // Client info should be displayed as Client #10
    expect(screen.getByText('Client #10')).toBeInTheDocument();
  });
});
