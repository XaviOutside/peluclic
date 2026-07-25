import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PrivacyPage from '@/pages/PrivacyPage';

function renderPrivacy() {
  return render(
    <MemoryRouter>
      <PrivacyPage />
    </MemoryRouter>,
  );
}

describe('PrivacyPage', () => {
  it('renders the privacy policy title', () => {
    renderPrivacy();
    expect(screen.getByText('privacy.title')).toBeInTheDocument();
  });

  it('renders at least 10 GDPR sections from data-driven array', () => {
    renderPrivacy();

    // All sections get level-2 headings — verify count ≥ 10
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings.length).toBeGreaterThanOrEqual(10);
  });

  it('renders title and content for the first section', () => {
    renderPrivacy();

    // Each section entry has { title, content } — rendered via t() calls
    expect(screen.getByText('privacy.sections.0.title')).toBeInTheDocument();
    expect(screen.getByText('privacy.sections.0.content')).toBeInTheDocument();
  });

  it('renders title and content for the last section', () => {
    renderPrivacy();

    expect(screen.getByText('privacy.sections.9.title')).toBeInTheDocument();
    expect(screen.getByText('privacy.sections.9.content')).toBeInTheDocument();
  });

  it('renders the back-home navigation link', () => {
    renderPrivacy();

    const link = screen.getByRole('link', { name: 'register.backHome' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders exactly 10 section headings when locale provides 10 sections', () => {
    renderPrivacy();

    const headings = screen.getAllByRole('heading', { level: 2 });
    // i18n mock returns exactly 10 sections for privacy.sections
    expect(headings).toHaveLength(10);
  });
});
