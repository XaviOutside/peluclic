import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PageHeader from '@/components/organisms/PageHeader';
import Button from '@/components/atoms/Button';

describe('PageHeader', () => {
  it('renders with search input and action button', () => {
    render(
      <PageHeader
        searchPlaceholder="Buscar..."
        searchValue=""
        onSearchChange={() => {}}
        action={<Button>Create</Button>}
      />,
    );
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('hides search input when hideSearch is true', () => {
    render(
      <PageHeader
        hideSearch
        action={<Button>Create</Button>}
      />,
    );
    expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('calls onSearchChange when user types', () => {
    const handleChange = vi.fn();
    render(
      <PageHeader
        searchPlaceholder="Search"
        searchValue=""
        onSearchChange={handleChange}
        action={null}
      />,
    );
    fireEvent.change(screen.getByTestId('search-input'), {
      target: { value: 'test' },
    });
    expect(handleChange).toHaveBeenCalledWith('test');
  });

  it('renders without action prop', () => {
    render(
      <PageHeader
        searchPlaceholder="Search"
        searchValue=""
        onSearchChange={() => {}}
      />,
    );
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has sticky positioning', () => {
    render(
      <PageHeader
        searchPlaceholder="Search"
        searchValue=""
        onSearchChange={() => {}}
      />,
    );
    const header = screen.getByTestId('page-header');
    expect(header).toHaveClass('sticky', 'top-0');
  });
});
