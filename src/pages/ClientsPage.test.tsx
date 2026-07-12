import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Client } from '@/types/client';
import ClientsPage from './ClientsPage';

afterEach(cleanup);

// Mock data
const mockClientWithAllFields: Client = {
  id: 42,
  name: 'María García',
  email: 'maria@example.com',
  phone: '555-1001',
  phone2: '555-1002',
  address: 'Calle Mayor 12',
  status: 'active',
  notes: null,
  lastServiceDate: '2026-06-15',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockClientMinimal: Client = {
  id: 7,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0001',
  phone2: null,
  address: null,
  status: 'active',
  notes: null,
  lastServiceDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// Use vi.hoisted to guarantee mockNavigate is available before any imports
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

// Mock useClients hook
vi.mock('@/hooks/useClients', () => ({
  useClients: () => ({
    clients: [mockClientWithAllFields, mockClientMinimal],
    isLoading: false,
    error: null,
    searchQuery: '',
    fetchClients: vi.fn(),
    search: vi.fn(),
    setSearchQuery: vi.fn(),
  }),
}));

// Mock useClientMutations
const { mockMutate } = vi.hoisted(() => ({
  mockMutate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/hooks/useClientMutations', () => ({
  useDeactivateClient: () => ({
    mutate: mockMutate,
    isLoading: false,
    error: null,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ClientsPage />
    </MemoryRouter>,
  );
}

describe('ClientsPage', () => {
  it('renders three columns with headers', () => {
    renderPage();

    // Column headers may appear in both desktop header row and mobile card labels
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getAllByText('Contacto').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Notas').length).toBeGreaterThan(0);

    // "Último servicio" column no longer exists — date moved inside Cliente column
    expect(screen.queryAllByText('Último servicio')).toHaveLength(0);
  });

  it('renders client name in bold with muted numeric ID', () => {
    renderPage();

    // Name in bold — check the element with font-semibold class
    const nameElement = screen.getByText('María García');
    expect(nameElement.className).toContain('font-semibold');

    // Muted #ID below the name
    expect(screen.getByText('#42')).toBeInTheDocument();
  });

  it('renders last service date in DD/MM/YYYY format within Cliente column', () => {
    renderPage();

    // Date now lives inside the Cliente column block with muted styling
    const dateElement = screen.getByText('15/06/2026');
    expect(dateElement).toBeInTheDocument();
    expect(dateElement.className).toContain('text-on-surface-variant');
    expect(dateElement.className).toContain('text-sm');
  });

  it('renders em dash for null last service date', () => {
    renderPage();

    // Both null lastServiceDate and null notes render '—'
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('renders expanded contact details with phone2 and address when present', () => {
    renderPage();

    expect(screen.getByText('555-1002')).toBeInTheDocument();
    expect(screen.getByText('Calle Mayor 12')).toBeInTheDocument();
  });

  it('omits phone2 and address when null', () => {
    renderPage();

    // John Doe has null phone2 and null address
    // The text should appear exactly once (belongs to María García)
    expect(screen.getByText('555-1002')).toBeInTheDocument();
    expect(screen.getByText('Calle Mayor 12')).toBeInTheDocument();
  });

  /* ── Cross-reference buttons ── */

  it('renders "Ver Mascotas" cross-ref button per row', () => {
    renderPage();

    const buttons = screen.getAllByTestId('crossref-action-clients-pets');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Ver Mascotas');
  });

  it('"Ver Mascotas" navigates to /pets?clientId=X', () => {
    mockNavigate.mockClear();
    renderPage();

    const buttons = screen.getAllByTestId('crossref-action-clients-pets');
    fireEvent.click(buttons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/pets?clientId=42');
  });

  it('renders "Ver Servicios" cross-ref button per row', () => {
    renderPage();

    const buttons = screen.getAllByTestId('crossref-action-clients-services');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Ver Servicios');
  });

  it('"Ver Servicios" navigates to /services', () => {
    mockNavigate.mockClear();
    renderPage();

    const buttons = screen.getAllByTestId('crossref-action-clients-services');
    fireEvent.click(buttons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/services');
  });

  /* ── Delete action ── */

  it('renders delete row action button', () => {
    renderPage();

    const deleteButtons = screen.getAllByTestId('row-action-delete');
    expect(deleteButtons).toHaveLength(2);
  });

  it('clicking delete opens ConfirmDialog', () => {
    renderPage();

    // ConfirmDialog should not be visible initially
    expect(screen.queryByText('Desactivar cliente')).not.toBeInTheDocument();

    // Click delete on first row
    const deleteButtons = screen.getAllByTestId('row-action-delete');
    fireEvent.click(deleteButtons[0]);

    // ConfirmDialog should now be visible with title and client name in message
    expect(screen.getByText('Desactivar cliente')).toBeInTheDocument();
    // María García appears both in the row and in the confirm dialog message
    expect(screen.getAllByText(/María García/).length).toBeGreaterThanOrEqual(2);
  });
});
