import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import LandingPage from '@/pages/LandingPage';

const mockSetMode = vi.fn();

// Mock window.location.href for full page reload on mode change
const locationRef = { href: '' };
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: locationRef,
    writable: true,
  });
});

const { mockUseStorageMode } = vi.hoisted(() => ({
  mockUseStorageMode: vi.fn(),
}));

vi.mock('@/storage/useStorageMode', () => ({
  useStorageMode: mockUseStorageMode,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSetMode.mockReset();
  locationRef.href = '';
  // Default: mode = null (unresolved)
  mockUseStorageMode.mockReturnValue({
    mode: null,
    setMode: mockSetMode,
    isResolved: false,
  });
});

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  it('renders hero section content', () => {
    renderLanding();
    expect(screen.getByText('hero.title')).toBeInTheDocument();
  });

  it('does NOT render inline mobile navigation', () => {
    renderLanding();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Calendar')).not.toBeInTheDocument();
    expect(screen.queryByText('More')).not.toBeInTheDocument();
  });

  it('renders features section', () => {
    renderLanding();
    expect(screen.getByText('features.scheduling.title')).toBeInTheDocument();
    expect(screen.getByText('features.clients.title')).toBeInTheDocument();
    expect(screen.getByText('features.pets.title')).toBeInTheDocument();
  });

  it('renders footer', () => {
    renderLanding();
    expect(screen.getByText('footer.copyright')).toBeInTheDocument();
  });

  it('shows "Try Demo" button', () => {
    renderLanding();
    const demoButton = screen.getByRole('button', { name: /hero.cta/i });
    expect(demoButton).toBeInTheDocument();
  });

  it('clicking "Try Demo" sets mode to demo and navigates to /clients', async () => {
    const user = userEvent.setup();
    renderLanding();

    const demoButton = screen.getByRole('button', { name: /hero.cta/i });
    await user.click(demoButton);

    expect(mockSetMode).toHaveBeenCalledWith('demo');
    expect(locationRef.href).toBe('/clients');
  });

  it('renders LanguageSwitcher in the hero section', () => {
    renderLanding();
    const langButton = screen.getByRole('button', { name: 'language.switchAria' });
    expect(langButton).toBeInTheDocument();
  });

  it('clicking "Log In" sets mode to api and navigates to /clients', async () => {
    const user = userEvent.setup();
    renderLanding();

    const loginButton = screen.getByRole('button', { name: /hero.demo/i });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toBeEnabled();

    await user.click(loginButton);

    expect(mockSetMode).toHaveBeenCalledWith('api');
    expect(locationRef.href).toBe('/clients');
  });
});
