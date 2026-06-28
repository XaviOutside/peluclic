import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ServiceListPage from './ServiceListPage';
import * as serviceApi from '@/services/service';
import type { Service } from '@/types/service';

vi.mock('@/services/service');

const mockService: Service = {
  id: 1,
  name: 'Full Groom',
  description: null,
  durationMinutes: 60,
  price: 50.00,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockedApi = vi.mocked(serviceApi);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => cleanup());

describe('ServiceListPage', () => {
  it('shows loading spinner initially', () => {
    // Don't resolve the promise yet
    (mockedApi.listServices as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <ServiceListPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('shows services when loaded', async () => {
    (mockedApi.listServices as ReturnType<typeof vi.fn>).mockResolvedValue([mockService]);

    render(
      <MemoryRouter>
        <ServiceListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Full Groom')).toBeInTheDocument();
    });
  });

  it('shows empty state when no services', async () => {
    (mockedApi.listServices as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <ServiceListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/no services/i)).toBeInTheDocument();
    });
  });

  it('shows error state on fetch failure', async () => {
    (mockedApi.listServices as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <ServiceListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('has "New Service" link', async () => {
    (mockedApi.listServices as ReturnType<typeof vi.fn>).mockResolvedValue([mockService]);

    render(
      <MemoryRouter>
        <ServiceListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const buttons = screen.getAllByText(/new service/i);
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
