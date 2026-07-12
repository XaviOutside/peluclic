import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchInput from '@/components/molecules/SearchInput';

describe('SearchInput', () => {
  it('renders with placeholder', () => {
    render(
      <SearchInput placeholder="Buscar clientes..." value="" onChange={() => {}} />,
    );
    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('placeholder', 'Buscar clientes...');
  });

  it('renders default placeholder when none provided', () => {
    render(<SearchInput value="" onChange={() => {}} />);
    const input = screen.getByTestId('search-input');
    // Default placeholder now uses i18n key
    expect(input).toHaveAttribute('placeholder', 'actions.search');
  });

  it('calls onValueChange when user types', () => {
    const handleChange = vi.fn();
    render(<SearchInput value="" onValueChange={handleChange} />);
    fireEvent.change(screen.getByTestId('search-input'), {
      target: { value: 'Rex' },
    });
    expect(handleChange).toHaveBeenCalledWith('Rex');
  });

  it('calls onChange when provided', () => {
    const handleChange = vi.fn();
    render(<SearchInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getByTestId('search-input'), {
      target: { value: 'test' },
    });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays the search icon', () => {
    render(<SearchInput value="" onChange={() => {}} />);
    const icon = screen.getByText('search');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('material-symbols-outlined');
  });

  it('renders with controlled value', () => {
    render(<SearchInput value="Luna" onChange={() => {}} />);
    expect(screen.getByTestId('search-input')).toHaveValue('Luna');
  });
});
