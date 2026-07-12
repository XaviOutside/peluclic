import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Service } from '@/types/service';
import ServicesPage from './ServicesPage';

afterEach(cleanup);

// Mock data
const mockServiceWithPet: Service = {
  id: 1,
  name: 'Corte de pelo',
  description: 'Corte completo con tijera',
  durationMinutes: 60,
  price: 45.0,
  petId: 7,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockServiceWithoutPet: Service = {
  id: 2,
  name: 'Baño',
  description: null,
  durationMinutes: 30,
  price: 25.0,
  petId: null,
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

// Mock useServices
vi.mock('@/hooks/useServices', () => ({
  useServices: () => ({
    services: [mockServiceWithPet, mockServiceWithoutPet],
    isLoading: false,
    error: null,
    page: 1,
    totalCount: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    refresh: vi.fn(),
    goToPage: vi.fn(),
    goToNextPage: vi.fn(),
    goToPreviousPage: vi.fn(),
    deleteService: vi.fn(),
  }),
}));

// Mock searchServices
vi.mock('@/services/service', () => ({
  searchServices: vi.fn().mockResolvedValue([]),
  listServices: vi.fn().mockResolvedValue([]),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ServicesPage />
    </MemoryRouter>,
  );
}

describe('ServicesPage', () => {
  it('renders service names in the table', () => {
    renderPage();

    expect(screen.getByText('Corte de pelo')).toBeInTheDocument();
    expect(screen.getByText('Baño')).toBeInTheDocument();
  });

  /* ── Cross-reference button ── */

  it('renders "Ver mascota" cross-ref button per row', () => {
    renderPage();

    const buttons = screen.getAllByTestId('crossref-action-services-pet');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Ver mascota');
  });

  it('disables "Ver mascota" when petId is null', () => {
    renderPage();

    const buttons = screen.getAllByTestId('crossref-action-services-pet');
    // First service has petId=7 → enabled
    expect(buttons[0]).not.toBeDisabled();
    // Second service has petId=null → disabled
    expect(buttons[1]).toBeDisabled();
  });

  it('"Ver mascota" navigates to /pets/:petId when pet is linked', () => {
    mockNavigate.mockClear();
    renderPage();

    const buttons = screen.getAllByTestId('crossref-action-services-pet');
    fireEvent.click(buttons[0]); // Service with petId=7
    expect(mockNavigate).toHaveBeenCalledWith('/pets/7');
  });

  /* ── Query param filtering ── */

  it('renders correctly when ?petId= query param is present', () => {
    render(
      <MemoryRouter initialEntries={['/services?petId=7']}>
        <ServicesPage />
      </MemoryRouter>,
    );

    // Should still render without errors
    expect(screen.getByTestId('services-page')).toBeInTheDocument();
    expect(screen.getAllByTestId('datatable-row').length).toBeGreaterThan(0);
  });
});
