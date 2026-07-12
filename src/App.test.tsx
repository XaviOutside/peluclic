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

    // Landing page content — i18n mock returns keys as values
    expect(screen.getByText('hero.title')).toBeInTheDocument();

    // Sidebar must NOT be present on public routes ("Bark & Bubbles" is hardcoded in Sidebar)
    expect(screen.queryByText('Bark & Bubbles')).not.toBeInTheDocument();

    // MobileNav must NOT be present on public routes (i18n key from MobileNav)
    expect(screen.queryByText('mobileNav.home')).not.toBeInTheDocument();
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

    // Sidebar must be present on dashboard routes ("Bark & Bubbles" is hardcoded)
    expect(screen.getByText('Bark & Bubbles')).toBeInTheDocument();

    // MobileNav must be present on dashboard routes (i18n key from MobileNav)
    expect(screen.getByText('mobileNav.home')).toBeInTheDocument();
  });
});
