import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/templates/DashboardLayout';

describe('DashboardLayout', () => {
  it('renders the Sidebar component', () => {
    render(
      <MemoryRouter>
        <DashboardLayout />
      </MemoryRouter>,
    );

    // Sidebar has unique brand text "Bark & Bubbles"
    expect(screen.getByText('Bark & Bubbles')).toBeInTheDocument();
  });

  it('renders the MobileNav component', () => {
    render(
      <MemoryRouter>
        <DashboardLayout />
      </MemoryRouter>,
    );

    // MobileNav has "Inicio" unique to it (Sidebar uses "Dashboard")
    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  it('has md:ml-64 offset class on the main element', () => {
    render(
      <MemoryRouter>
        <DashboardLayout />
      </MemoryRouter>,
    );

    const main = screen.getByRole('main');
    expect(main).toHaveClass('md:ml-64');
  });

  it('renders child route content via Outlet', () => {
    render(
      <MemoryRouter initialEntries={['/clients']}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/clients" element={<div data-testid="child-content">Dashboard Child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Child')).toBeInTheDocument();
  });

  it('preserves the flex container with sidebar offset layout', () => {
    render(
      <MemoryRouter>
        <DashboardLayout />
      </MemoryRouter>,
    );

    const main = screen.getByRole('main');
    // Current App.tsx structure: main has flex-1, pb-24, md:ml-64, md:pb-8
    expect(main).toHaveClass('flex-1');
    expect(main).toHaveClass('pb-24');
    expect(main).toHaveClass('md:ml-64');
    expect(main).toHaveClass('md:pb-8');
  });
});
