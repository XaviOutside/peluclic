import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PublicLayout from '@/components/templates/PublicLayout';

describe('PublicLayout', () => {
  it('does NOT render the Sidebar component', () => {
    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    );

    // Sidebar brand text must not be in the DOM
    expect(screen.queryByText('Bark & Bubbles')).not.toBeInTheDocument();
    // Sidebar navigation items must not be present
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('does NOT render the MobileNav component', () => {
    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    );

    // MobileNav has "Inicio" unique to it
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
  });

  it('does NOT have md:ml-64 offset on the main element', () => {
    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    );

    const main = screen.getByRole('main');
    expect(main).not.toHaveClass('md:ml-64');
  });

  it('renders child route content via Outlet', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<div data-testid="public-child">Landing Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('public-child')).toBeInTheDocument();
    expect(screen.getByText('Landing Page')).toBeInTheDocument();
  });

  it('renders as a full-width layout without sidebar chrome', () => {
    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    );

    const main = screen.getByRole('main');

    // Must not have sidebar-related offset classes
    expect(main).not.toHaveClass('md:ml-64');

    // Must not have mobile bottom padding (no MobileNav)
    expect(main).not.toHaveClass('pb-24');
  });
});
