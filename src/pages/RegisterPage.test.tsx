import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '@/pages/RegisterPage';

describe('RegisterPage', () => {
  it('renders placeholder content', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/coming soon|register|próximamente/i)).toBeInTheDocument();
  });

  it('renders a back link to home', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole('link', { name: /volver|back|inicio/i });
    expect(backLink).toHaveAttribute('href', '/');
  });
});
