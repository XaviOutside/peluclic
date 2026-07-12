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

    // i18n mock returns key as value
    expect(screen.getByText('register.title')).toBeInTheDocument();
  });

  it('renders a back link to home', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole('link', { name: 'register.backHome' });
    expect(backLink).toHaveAttribute('href', '/');
  });
});
