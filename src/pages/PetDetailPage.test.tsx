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

    // PetDetailCard was i18n'd in PR2 — species/breed combined, sex via t(), weight via t()
    expect(screen.getByText('Dog — Golden Retriever')).toBeInTheDocument();
    // Sex is now an i18n key from pets namespace with prefix
    expect(screen.getByText('pets.sex.male')).toBeInTheDocument();
    // Weight with interpolation
    expect(screen.getByText('pets.detail.weightUnit')).toBeInTheDocument();
    // Notes is data
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
      expect(screen.getByText('detail.notFound')).toBeInTheDocument();
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

    // PetDetailCard renders back button with unprefixed key
    const backButtons = screen.getAllByRole('button', { name: /actions.backToList/i });
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
    await user.click(screen.getByRole('button', { name: 'actions.edit' }));

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

    const deactivateButtons = screen.getAllByRole('button', { name: 'actions.deactivate' });
    await user.click(deactivateButtons[0]);

    // Confirm dialog — title from PetDetailPage detail keys
    expect(screen.getByText('detail.deactivatePet')).toBeInTheDocument();
    // Message with interpolation returns raw key
    expect(screen.getByText('detail.deactivateMessage')).toBeInTheDocument();

    // Mock the deactivate API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...activePet, status: 'inactive' }),
    });

    // Click confirm in the dialog
    const confirmButtons = screen.getAllByRole('button', { name: 'common:actions.deactivate' });
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

    // Client info uses i18n key with interpolation
    expect(screen.getByText('detail.clientNumber')).toBeInTheDocument();
  });
});

describe('PetDetailPage — linked services', () => {
  const linkedServices = [
    {
      id: 101,
      name: 'Bath & Brush',
      description: 'Full bath and brushing',
      durationMinutes: 30,
      price: 45.0,
      petId: 1,
      status: 'active' as const,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 102,
      name: 'Nail Trim',
      description: 'Nail clipping',
      durationMinutes: 15,
      price: 20.0,
      petId: 1,
      status: 'active' as const,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  ];

  const unlinkedServices = [
    {
      id: 201,
      name: 'Dental Cleaning',
      description: 'Teeth cleaning',
      durationMinutes: 45,
      price: 75.0,
      petId: null,
      status: 'active' as const,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  ];

  it('shows loading spinner while linked services are fetching', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(activePet),
    });
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    // Linked Services heading now uses i18n key
    expect(screen.getByText('detail.linkedServices')).toBeInTheDocument();
    const spinners = screen.getAllByRole('status', { name: /loading/i });
    expect(spinners.length).toBeGreaterThanOrEqual(1);
  });

  it('renders linked services in ServiceTable', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(activePet),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: linkedServices, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('detail.linkedServices')).toBeInTheDocument();
    });

    // Service names and prices are data, not i18n
    expect(screen.getByText('Bath & Brush')).toBeInTheDocument();
    expect(screen.getByText('Nail Trim')).toBeInTheDocument();
    expect(screen.getByText('$45.00')).toBeInTheDocument();
    expect(screen.getByText('$20.00')).toBeInTheDocument();
    expect(screen.queryByText('detail.noLinkedServices')).not.toBeInTheDocument();
  });

  it('shows empty state with Link Service button when no linked services', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(activePet),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('detail.noLinkedServices')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /detail\.linkService/i })).toBeInTheDocument();
  });

  it('shows error state with retry button when services fail', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(activePet),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Failed to load services' }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load services/i)).toBeInTheDocument();
    });

    // Retry button uses common namespace
    expect(screen.getByRole('button', { name: /common:errors.retry/i })).toBeInTheDocument();
  });

  it('Link Service button opens modal with unlinked services', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(activePet),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('detail.noLinkedServices')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /detail\.linkService/i }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: unlinkedServices, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }),
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /detail\.linkService/i })).toBeInTheDocument();
    });
  });
});
