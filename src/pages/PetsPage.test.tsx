import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Pet } from '@/types/pet';
import PetsPage from './PetsPage';

afterEach(cleanup);

// Mock data
const mockPet1: Pet = {
  id: 7,
  clientId: 42,
  name: 'Rex',
  species: 'Perro',
  breed: 'Golden Retriever',
  sex: 'male',
  dateOfBirth: '2020-05-15',
  weightKg: 30.5,
  notes: null,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockPet2: Pet = {
  id: 8,
  clientId: 99,
  name: 'Luna',
  species: 'Gato',
  breed: 'Siames',
  sex: 'female',
  dateOfBirth: '2022-03-10',
  weightKg: 4.2,
  notes: null,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// Use vi.hoisted for mocks before imports
const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock usePets
vi.mock('@/hooks/usePets', () => ({
  usePets: () => ({
    pets: [mockPet1, mockPet2],
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    goToPage: vi.fn(),
    setClientId: vi.fn(),
  }),
}));

// Mock usePetMutations (already used by existing PetsPage)
vi.mock('@/hooks/usePetMutations', () => ({
  useDeactivatePet: () => ({
    mutate: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    error: null,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <PetsPage />
    </MemoryRouter>,
  );
}

describe('PetsPage', () => {
  it('renders pet names in the table', () => {
    renderPage();

    expect(screen.getByText('Rex')).toBeInTheDocument();
    expect(screen.getByText('Luna')).toBeInTheDocument();
  });

  /* ── Cross-reference buttons ── */

  it('renders "Ver Cliente" cross-ref button per row', () => {
    renderPage();

    const buttons = screen.getAllByTestId('crossref-action-pets-client');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Ver Cliente');
  });

  it('"Ver Cliente" navigates to /clients/:clientId', () => {
    mockNavigate.mockClear();
    renderPage();

    const buttons = screen.getAllByTestId('crossref-action-pets-client');
    fireEvent.click(buttons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/clients/42');
  });

  it('renders "Ver Servicios" cross-ref button per row', () => {
    renderPage();

    const buttons = screen.getAllByTestId('crossref-action-pets-services');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Ver Servicios');
  });

  it('"Ver Servicios" navigates to /services?petId=X', () => {
    mockNavigate.mockClear();
    renderPage();

    const buttons = screen.getAllByTestId('crossref-action-pets-services');
    fireEvent.click(buttons[1]); // Luna, id=8
    expect(mockNavigate).toHaveBeenCalledWith('/services?petId=8');
  });

  /* ── Query param filtering ── */

  it('renders correctly when ?clientId= query param is present', () => {
    render(
      <MemoryRouter initialEntries={['/pets?clientId=42']}>
        <PetsPage />
      </MemoryRouter>,
    );

    // Should still render without errors
    expect(screen.getByTestId('pets-page')).toBeInTheDocument();
    expect(screen.getAllByTestId('datatable-row').length).toBeGreaterThan(0);
  });
});
