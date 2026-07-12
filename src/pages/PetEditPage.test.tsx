import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PetEditPage from './PetEditPage';

afterEach(cleanup);

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const existingPet = {
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

const mockClients = [
  {
    id: 10,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '+1 (555) 111-1111',
    phone2: null,
    address: null,
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 20,
    name: 'Bob Smith',
    email: 'bob@example.com',
    phone: '+1 (555) 222-2222',
    phone2: null,
    address: null,
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function renderPage(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/pets/${id}/edit`]}>
      <Routes>
        <Route path="/pets/:id/edit" element={<PetEditPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  mockNavigate.mockReset();
});

/** Helper: wait for the page to finish loading and render the form */
async function waitForFormReady() {
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Edit Pet' })).toBeInTheDocument();
  });
}

describe('PetEditPage', () => {
  it('shows loading spinner initially', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
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

  it('renders form pre-populated with pet data', async () => {
    // Fetch pet
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(existingPet),
    });
    // Fetch clients
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockClients, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }),
    });

    renderPage();

    await waitForFormReady();

    const nameInput = screen.getByLabelText(/^Name/) as HTMLInputElement;
    const speciesInput = screen.getByLabelText(/^Species/) as HTMLInputElement;
    const breedInput = screen.getByLabelText(/^Breed/) as HTMLInputElement;
    const clientSelect = screen.getByLabelText('Client') as HTMLSelectElement;

    expect(nameInput.value).toBe('Max');
    expect(speciesInput.value).toBe('Dog');
    expect(breedInput.value).toBe('Golden Retriever');

    // Client dropdown should show active clients
    expect(clientSelect.options).toHaveLength(2);
    expect(clientSelect.options[0].textContent).toBe('Alice Johnson');
    expect(clientSelect.options[1].textContent).toBe('Bob Smith');
  });

  it('updates pet successfully and redirects to detail page', async () => {
    const user = userEvent.setup();

    // Fetch pet
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(existingPet),
    });
    // Fetch clients
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockClients, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }),
    });
    // Update pet
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...existingPet, name: 'Max Updated' }),
    });

    renderPage();
    await waitForFormReady();

    // Clear and retype name
    const nameInput = screen.getByLabelText(/^Name/) as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'Max Updated');

    await user.click(screen.getByRole('button', { name: 'Update Pet' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pets/1');
    });
  });

  it('shows field-level validation errors on 422 response', async () => {
    const user = userEvent.setup();

    // Fetch pet
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(existingPet),
    });
    // Fetch clients
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockClients, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }),
    });
    // Update returns 422
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({
          error: 'Validation failed',
          statusCode: 422,
          fieldErrors: {
            name: 'A pet with this name already exists',
          },
        }),
    });

    renderPage();
    await waitForFormReady();

    await user.click(screen.getByRole('button', { name: 'Update Pet' }));

    await waitFor(() => {
      expect(screen.getByText('A pet with this name already exists')).toBeInTheDocument();
    });
  });

  it('shows general error on server failure', async () => {
    const user = userEvent.setup();

    // Fetch pet
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(existingPet),
    });
    // Fetch clients
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockClients, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }),
    });
    // Update returns 500
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          error: 'Internal server error',
          statusCode: 500,
        }),
    });

    renderPage();
    await waitForFormReady();

    await user.click(screen.getByRole('button', { name: 'Update Pet' }));

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  it('has a Back button that navigates to pet detail', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(existingPet),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockClients, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }),
    });

    const user = userEvent.setup();
    renderPage();

    await waitForFormReady();

    await user.click(screen.getByRole('button', { name: /← Back/ }));

    expect(mockNavigate).toHaveBeenCalledWith('/pets/1');
  });
});
