import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PetCreatePage from './PetCreatePage';

afterEach(cleanup);

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockClients = [
  {
    id: 1,
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
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    phone: '+1 (555) 222-2222',
    phone2: null,
    address: null,
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Inactive Owner',
    email: 'inactive@example.com',
    phone: '+1 (555) 333-3333',
    phone2: null,
    address: null,
    status: 'inactive',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const createdPet = {
  id: 42,
  clientId: 1,
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

function renderPage() {
  return render(
    <MemoryRouter>
      <PetCreatePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  mockNavigate.mockReset();
});

/** Helper: wait for the page to finish loading clients and render the form */
async function waitForFormReady() {
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Create Pet' })).toBeInTheDocument();
  });
}

/** Helper: fill in valid pet form data */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Name/), 'Max');
  await user.type(screen.getByLabelText(/^Species/), 'Dog');
  await user.type(screen.getByLabelText(/^Breed/), 'Golden Retriever');
  await user.selectOptions(screen.getByLabelText('Client'), '1');
}

describe('PetCreatePage', () => {
  it('shows loading state while fetching clients', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders form with client options after loading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockClients, meta: { total: 2, page: 1, limit: 200, totalPages: 1 } }),
    });

    renderPage();

    await waitForFormReady();

    // Form fields should be present (labels include * for required fields)
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Species/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Breed/)).toBeInTheDocument();
    expect(screen.getByLabelText('Sex')).toBeInTheDocument();
    expect(screen.getByLabelText('Client')).toBeInTheDocument();

    // Only active clients should appear as options
    const clientSelect = screen.getByLabelText('Client') as HTMLSelectElement;
    expect(clientSelect.options).toHaveLength(2); // 2 active, no placeholder
    expect(clientSelect.options[0].textContent).toBe('Alice Johnson');
    expect(clientSelect.options[1].textContent).toBe('Bob Smith');
  });

  it('submits form successfully and navigates to pet detail', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockClients, meta: { total: 2, page: 1, limit: 200, totalPages: 1 } }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(createdPet),
    });

    renderPage();
    await waitForFormReady();
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Create Pet' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pets/42');
    });
  });

  it('shows field-level validation errors on 422 response', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockClients, meta: { total: 2, page: 1, limit: 200, totalPages: 1 } }),
    });
    // Server returns 422 with field-level errors even though client validation passes
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({
          error: 'Validation failed',
          statusCode: 422,
          fieldErrors: {
            name: 'A pet with this name already exists',
            clientId: 'The client is inactive',
          },
        }),
    });

    renderPage();
    await waitForFormReady();
    // Fill in valid data so client-side validation passes
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Create Pet' }));

    await waitFor(() => {
      expect(screen.getByText('A pet with this name already exists')).toBeInTheDocument();
    });
  });

  it('shows general error on server failure', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockClients, meta: { total: 2, page: 1, limit: 200, totalPages: 1 } }),
    });
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
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Create Pet' }));

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  it('has a Back button that navigates to /pets', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockClients, meta: { total: 2, page: 1, limit: 200, totalPages: 1 } }),
    });

    const user = userEvent.setup();
    renderPage();

    await waitForFormReady();

    await user.click(screen.getByRole('button', { name: /← Back/ }));

    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });
});
