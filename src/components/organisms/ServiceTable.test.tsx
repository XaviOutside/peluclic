import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ServiceTable from './ServiceTable';
import type { Service } from '@/types/service';

const mockService: Service = {
  id: 1,
  name: 'Full Groom',
  description: 'Complete grooming',
  durationMinutes: 60,
  price: 50.00,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockServiceWithNullDuration: Service = {
  ...mockService,
  id: 2,
  name: 'Bath Only',
  durationMinutes: null,
  price: 25.00,
};

const mockInactiveService: Service = {
  ...mockService,
  id: 3,
  name: 'Old Service',
  status: 'inactive',
};

afterEach(() => cleanup());

describe('ServiceTable', () => {
  it('renders service rows with correct columns', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ServiceTable
        services={[mockService]}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Full Groom')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('shows "N/A" for null duration', () => {
    render(
      <ServiceTable
        services={[mockServiceWithNullDuration]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders active and inactive badges', () => {
    render(
      <ServiceTable
        services={[mockService, mockInactiveService]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('shows empty state when no services', () => {
    render(
      <ServiceTable services={[]} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(screen.getByText(/no services/i)).toBeInTheDocument();
  });

  it('formats price with two decimal places', () => {
    const svc: Service = { ...mockService, id: 10, price: 49.99 };

    render(
      <ServiceTable services={[svc]} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(screen.getByText('$49.99')).toBeInTheDocument();
  });
});
