import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';

describe('App routing — public routes', () => {
  it('renders LandingPage at "/" without Sidebar or MobileNav', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    // Landing page content should be visible
    expect(screen.getByText('Manage your grooming salon with ease.')).toBeInTheDocument();

    // Sidebar must NOT be present on public routes
    expect(screen.queryByText('Bark & Bubbles')).not.toBeInTheDocument();

    // MobileNav must NOT be present on public routes
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
  });
});

describe('App routing — dashboard routes', () => {
  it('renders ClientsPage at "/clients" with Sidebar and MobileNav', () => {
    render(
      <MemoryRouter initialEntries={['/clients']}>
        <App />
      </MemoryRouter>,
    );

    // Dashboard page content — clients page container is visible
    expect(screen.getByTestId('clients-page')).toBeInTheDocument();

    // Sidebar must be present on dashboard routes
    expect(screen.getByText('Bark & Bubbles')).toBeInTheDocument();

    // MobileNav must be present on dashboard routes
    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });
});
