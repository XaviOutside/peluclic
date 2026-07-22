import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/molecules/LanguageSwitcher';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LanguageSwitcher', () => {
  it('forwards className prop to the button element', () => {
    render(<LanguageSwitcher className="my-pill" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('my-pill');
  });

  it('renders with default classes only when no className provided', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button');
    // Default classes must be present (backward compatibility)
    expect(button.className).toContain('flex w-full');
    expect(button.className).toContain('rounded-lg');
    // Must NOT contain 'undefined' or 'null' from template literal fallback
    expect(button.className).not.toContain('undefined');
    expect(button.className).not.toContain('null');
  });

  it('calls changeLanguage when clicked', async () => {
    const user = userEvent.setup();
    const { i18n } = useTranslation('common');
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button');
    await user.click(button);
    expect(i18n.changeLanguage).toHaveBeenCalled();
  });
});
