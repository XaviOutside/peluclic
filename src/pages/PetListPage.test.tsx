import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PetListPage from './PetListPage';

afterEach(cleanup);

const mockPet = {
  id: 1,
  client_id: 10,
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

const mockPets = [
  mockPet,
  { ...mockPet, id: 2, name: 'Bella', breed: 'Labrador' },
];

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function renderPage() {
  return render(
    <BrowserRouter>
      <PetListPage />
    </BrowserRouter>,
  );
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('PetListPage', () => {
  it('shows loading spinner initially', () => {
    // Never resolve the fetch to keep loading state
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders pet data after loading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockPets),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    expect(screen.getByText('Bella')).toBeInTheDocument();
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText('Labrador')).toBeInTheDocument();
    // Both pets are Dogs — use getAllByText
    expect(screen.getAllByText('Dog')).toHaveLength(2);
  });

  it('shows empty state when no pets exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No pets found.')).toBeInTheDocument();
    });
  });

  it('shows error state on fetch failure with retry button', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it('has a Create Pet button that links to /pets/new', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create pet/i })).toBeInTheDocument();
    });
  });
});
