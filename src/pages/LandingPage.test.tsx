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

    // Landing page no longer has inline nav — verify those labels aren't present
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Calendar')).not.toBeInTheDocument();
    expect(screen.queryByText('More')).not.toBeInTheDocument();
  });

  it('CTA links to /register via i18n key', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    // i18n mock returns the key "hero.cta" for t('hero.cta')
    const ctaLink = screen.getByRole('link', { name: /hero.cta/i });
    expect(ctaLink).toHaveAttribute('href', '/register');
  });

  it('renders hero section content', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    // i18n mock returns keys as values
    expect(screen.getByText('hero.title')).toBeInTheDocument();
  });

  it('renders features section', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    // Feature titles are now i18n keys
    expect(screen.getByText('features.scheduling.title')).toBeInTheDocument();
    expect(screen.getByText('features.clients.title')).toBeInTheDocument();
    expect(screen.getByText('features.pets.title')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('footer.copyright')).toBeInTheDocument();
  });
});
