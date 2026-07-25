import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClientDetailPage from './ClientDetailPage';

afterEach(cleanup);

const mockClient = {
  id: 1,
  name: 'Alice Johnson',
  email: 'alice@example.com',
  phone: '+1 (555) 111-1111',
  phone2: null,
  address: '123 Main St',
  status: 'active' as const,
  lastServiceDate: null,
  notes: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockPets = [
  {
    id: 1,
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
  },
  {
    id: 2,
    clientId: 1,
    name: 'Bella',
    species: 'Dog',
    breed: 'Labrador',
    sex: 'female' as const,
    dateOfBirth: null,
    weightKg: null,
    notes: null,
    status: 'active' as const,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

const emptyPetList = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
const emptyServiceList = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };

const mockStorage = {
  getClient: vi.fn(),
  listPets: vi.fn(),
  listServices: vi.fn(),
};

const mockHardDeleteMutate = vi.fn();

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(() => ({ id: 1, email: 'admin@test.com', role: 'admin' })),
}));

vi.mock('@/hooks/useClientMutations', async () => {
  const actual = await vi.importActual('@/hooks/useClientMutations');
  return {
    ...actual,
    useHardDeleteClient: () => ({
      mutate: mockHardDeleteMutate,
      isLoading: false,
      error: null,
    }),
  };
});

vi.mock('@/storage/storageContext', () => ({
  getStorage: () => mockStorage,
}));

function renderPage(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/clients/${id}`]}>
      <Routes>
        <Route path="/clients/:id" element={<ClientDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ClientDetailPage — embedded pet list', () => {
  it('renders pet list section when pets are loaded', async () => {
    mockStorage.getClient.mockResolvedValueOnce(mockClient);
    mockStorage.listPets.mockResolvedValueOnce({ data: mockPets, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } });
    mockStorage.listServices.mockResolvedValue(emptyServiceList);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    expect(screen.getByText('Bella')).toBeInTheDocument();
    expect(screen.getByText('detail.pets')).toBeInTheDocument();
  });

  it('shows empty pet list when client has no pets', async () => {
    mockStorage.getClient.mockResolvedValueOnce(mockClient);
    mockStorage.listPets.mockResolvedValueOnce(emptyPetList);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('empty.noPets')).toBeInTheDocument();
    });
  });

  it('has an Add Pet button', async () => {
    mockStorage.getClient.mockResolvedValueOnce(mockClient);
    mockStorage.listPets.mockResolvedValueOnce(emptyPetList);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('empty.noPets')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /detail\.addPet/i })).toBeInTheDocument();
  });

  it('still displays client card with edit and deactivate buttons', async () => {
    mockStorage.getClient.mockResolvedValueOnce(mockClient);
    mockStorage.listPets.mockResolvedValueOnce(emptyPetList);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'actions.edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'actions.deactivate' })).toBeInTheDocument();
  });
});

describe('ClientDetailPage — hard-delete (admin only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.listServices.mockResolvedValue(emptyServiceList);
  });

  async function renderAsAdmin() {
    const { useUser } = await import('@/hooks/useUser');
    vi.mocked(useUser).mockReturnValue({ id: 1, email: 'admin@test.com', role: 'admin' });

    mockStorage.getClient.mockResolvedValueOnce(mockClient);
    mockStorage.listPets.mockResolvedValueOnce(emptyPetList);

    renderPage();
  }

  async function renderAsEmployee() {
    const { useUser } = await import('@/hooks/useUser');
    vi.mocked(useUser).mockReturnValue({ id: 2, email: 'emp@test.com', role: 'employee' });

    mockStorage.getClient.mockResolvedValueOnce(mockClient);
    mockStorage.listPets.mockResolvedValueOnce(emptyPetList);

    renderPage();
  }

  it('renders "Delete Permanently" button when user role is admin', async () => {
    await renderAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'actions.deletePermanently' })).toBeInTheDocument();
  });

  it('does NOT render "Delete Permanently" button when user role is employee', async () => {
    await renderAsEmployee();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'actions.deletePermanently' })).toBeNull();
  });

  it('shows confirmation modal when clicking "Delete Permanently"', async () => {
    await renderAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'actions.deletePermanently' }));

    await waitFor(() => {
      expect(screen.getByText('hardDelete.title')).toBeInTheDocument();
    });

    expect(screen.getByText('hardDelete.message')).toBeInTheDocument();
    expect(screen.getByText('hardDelete.confirmLabel')).toBeInTheDocument();
  });

  it('confirms deletion and calls hardDeleteClient mutation', async () => {
    mockHardDeleteMutate.mockResolvedValueOnce(undefined);

    await renderAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'actions.deletePermanently' }));

    await waitFor(() => {
      expect(screen.getByText('hardDelete.title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('hardDelete.confirmLabel'));

    await waitFor(() => {
      expect(mockHardDeleteMutate).toHaveBeenCalledWith(1);
    });
  });

  it('cancelling the modal does NOT call hardDeleteClient', async () => {
    await renderAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'actions.deletePermanently' }));

    await waitFor(() => {
      expect(screen.getByText('hardDelete.title')).toBeInTheDocument();
    });

    // Click cancel — find the cancel button in the ConfirmDialog
    fireEvent.click(screen.getByText('actions.cancel'));

    await waitFor(() => {
      expect(mockHardDeleteMutate).not.toHaveBeenCalled();
    });
  });
});
