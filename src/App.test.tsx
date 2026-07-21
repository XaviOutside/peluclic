import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';

const { mockListClients, mockGetSettings } = vi.hoisted(() => ({
  mockListClients: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
  mockGetSettings: vi.fn().mockResolvedValue({ companyName: 'Bark & Bubbles', logoUrl: null, tagline: null }),
}));

vi.mock('@/storage/storageContext', () => ({
  getStorage: () => ({
    listClients: mockListClients,
    getSettings: mockGetSettings,
  }),
}));

beforeEach(() => {
  // Set mode to 'api' so useStorageMode returns isResolved=true
  localStorage.setItem('pf_demo:mode', 'api');
});

describe('App routing — public routes', () => {
  it('redirects "/" to "/clients" when mode is resolved', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    // Redirected to clients page — client list container visible
    await waitFor(() => {
      expect(screen.getByTestId('clients-page')).toBeInTheDocument();
    });
  });
});

describe('App routing — dashboard routes', () => {
  it('renders ClientsPage at "/clients" with Sidebar and MobileNav', async () => {
    render(
      <MemoryRouter initialEntries={['/clients']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('clients-page')).toBeInTheDocument();
    });

    // Sidebar is present — verify via the "Bark & Bubbles" company name
    await waitFor(() => {
      expect(screen.getByText('Bark & Bubbles')).toBeInTheDocument();
    });

    // MobileNav must be present on dashboard routes
    expect(screen.getByText('mobileNav.home')).toBeInTheDocument();
  });
});
