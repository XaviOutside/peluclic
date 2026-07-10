import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Avatar from '@/components/atoms/Avatar';

describe('Avatar', () => {
  it('renders initials from name', () => {
    render(<Avatar name="María García" />);
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    expect(screen.getByText('MG')).toBeInTheDocument();
  });

  it('renders single initial for single-word name', () => {
    render(<Avatar name="Carlos" />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renders question mark for empty name', () => {
    render(<Avatar name="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    render(
      <Avatar
        name="María García"
        src="https://example.com/photo.jpg"
        imgProps={{ alt: 'María' }}
      />,
    );
    const img = screen.getByAltText('María');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('renders initials instead of image when src is not provided', () => {
    render(<Avatar name="Laura López" />);
    expect(screen.getByText('LL')).toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { container } = render(<Avatar name="Test" size="lg" />);
    const avatar = container.querySelector('[data-testid="avatar"]');
    expect(avatar).toHaveClass('h-12', 'w-12');
  });

  it('has accessible label from name', () => {
    render(<Avatar name="Pedro Pérez" />);
    expect(screen.getByRole('img', { name: 'Pedro Pérez' })).toBeInTheDocument();
  });

  it('derives consistent color for the same name', () => {
    const { container: c1 } = render(<Avatar name="Ana" />);
    const { container: c2 } = render(<Avatar name="Ana" />);
    const cls1 = c1.querySelector('[data-testid="avatar"]')!.className;
    const cls2 = c2.querySelector('[data-testid="avatar"]')!.className;
    expect(cls1).toBe(cls2);
  });
});
