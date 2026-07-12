import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ServiceDetailCard from './ServiceDetailCard';
import type { Service } from '@/types/service';

const activeService: Service = {
  id: 1,
  name: 'Full Groom',
  description: 'Complete grooming package',
  durationMinutes: 60,
  price: 50.00,
  petId: null,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const inactiveService: Service = {
  ...activeService,
  id: 2,
  status: 'inactive',
};

afterEach(() => cleanup());

describe('ServiceDetailCard', () => {
  it('renders all service fields', () => {
    render(
      <ServiceDetailCard
        service={activeService}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('Full Groom')).toBeInTheDocument();
    expect(screen.getByText('Complete grooming package')).toBeInTheDocument();
    // StatusBadge was i18n'd — returns i18n key
    expect(screen.getByText('status.active')).toBeInTheDocument();
  });

  it('shows Active badge for active service', () => {
    render(
      <ServiceDetailCard
        service={activeService}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('status.active')).toBeInTheDocument();
  });

  it('shows Inactive badge for inactive service', () => {
    render(
      <ServiceDetailCard
        service={inactiveService}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('status.inactive')).toBeInTheDocument();
  });

  it('shows Deactivate + Delete buttons for active service', () => {
    render(
      <ServiceDetailCard
        service={activeService}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /actions.deactivate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actions.delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actions.edit/i })).toBeInTheDocument();
  });

  it('hides Deactivate button for inactive service', () => {
    render(
      <ServiceDetailCard
        service={inactiveService}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /actions.deactivate/i })).toBeNull();
    expect(screen.getByRole('button', { name: /actions.delete/i })).toBeInTheDocument();
  });

  it('displays price in dollar format', () => {
    render(
      <ServiceDetailCard
        service={activeService}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText(/\$50\.00/)).toBeInTheDocument();
  });

  it('displays duration in minutes', () => {
    render(
      <ServiceDetailCard
        service={activeService}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    // formatDuration now returns i18n key with services namespace
    expect(screen.getByText('services.format.durationMinutes')).toBeInTheDocument();
  });

  it('shows i18n key for null description', () => {
    const svc = { ...activeService, description: null };
    render(
      <ServiceDetailCard
        service={svc}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('detail.notProvided')).toBeInTheDocument();
  });
});
