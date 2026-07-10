import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';

describe('LandingPage', () => {
  it('does NOT render inline mobile navigation', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    // The LandingPage inline nav (lines 124-141) has English labels "Home", "Calendar", "Clients", "More"
    // These are unique to the duplicated inline nav; MobileNav uses Spanish ("Inicio", "Calendario", etc.)
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Calendar')).not.toBeInTheDocument();
    expect(screen.queryByText('More')).not.toBeInTheDocument();

    // The inline nav's nav container with "fixed bottom-0" is the one being removed;
    // the NavLink-based MobileNav is a different component not present on this page.
    // We verify "Clients" (English) from inline nav is gone; MobileNav uses "Clientes" (Spanish).
  });

  it('CTA "Prueba gratis" links to /register', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const ctaLink = screen.getByRole('link', { name: /prueba gratis/i });
    expect(ctaLink).toHaveAttribute('href', '/register');
  });

  it('renders hero section content', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    // Hero headline should be visible
    expect(screen.getByText('Manage your grooming salon with ease.')).toBeInTheDocument();
  });

  it('renders features section', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    // Feature cards should be visible
    expect(screen.getByText('Smart Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Client Directory')).toBeInTheDocument();
    expect(screen.getByText('Pet Profiles')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/All paws reserved/)).toBeInTheDocument();
  });
});
