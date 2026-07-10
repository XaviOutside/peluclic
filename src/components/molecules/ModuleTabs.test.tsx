import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModuleTabs from '@/components/molecules/ModuleTabs';

const TABS = [
  { id: 'clients', label: 'Clientes', icon: 'group', count: 12 },
  { id: 'pets', label: 'Mascotas', icon: 'pets' },
  { id: 'services', label: 'Servicios', icon: 'content_cut', count: 5 },
];

describe('ModuleTabs', () => {
  it('renders all tabs', () => {
    render(
      <ModuleTabs tabs={TABS} activeTab="clients" onTabChange={() => {}} />,
    );
    expect(screen.getByTestId('tab-clients')).toBeInTheDocument();
    expect(screen.getByTestId('tab-pets')).toBeInTheDocument();
    expect(screen.getByTestId('tab-services')).toBeInTheDocument();
  });

  it('marks active tab as selected', () => {
    render(
      <ModuleTabs tabs={TABS} activeTab="pets" onTabChange={() => {}} />,
    );
    expect(screen.getByTestId('tab-pets')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('tab-clients')).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onTabChange when a tab is clicked', () => {
    const handleChange = vi.fn();
    render(
      <ModuleTabs tabs={TABS} activeTab="clients" onTabChange={handleChange} />,
    );
    fireEvent.click(screen.getByTestId('tab-services'));
    expect(handleChange).toHaveBeenCalledWith('services');
  });

  it('shows count badge when provided', () => {
    render(
      <ModuleTabs tabs={TABS} activeTab="clients" onTabChange={() => {}} />,
    );
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not show count badge when undefined', () => {
    render(
      <ModuleTabs tabs={TABS} activeTab="clients" onTabChange={() => {}} />,
    );
    // pets tab has no count, so there should only be 2 count elements total
    const badges = screen.getAllByText(/^\d+$/);
    expect(badges).toHaveLength(2);
  });

  it('renders Material Symbols icons', () => {
    render(
      <ModuleTabs tabs={TABS} activeTab="clients" onTabChange={() => {}} />,
    );
    const icons = [
      screen.getByText('group'),
      screen.getByText('pets'),
      screen.getByText('content_cut'),
    ];
    icons.forEach((icon) => {
      expect(icon).toHaveClass('material-symbols-outlined');
    });
  });

  it('has role tablist', () => {
    render(
      <ModuleTabs tabs={TABS} activeTab="clients" onTabChange={() => {}} />,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('has role tab on each tab', () => {
    render(
      <ModuleTabs tabs={TABS} activeTab="clients" onTabChange={() => {}} />,
    );
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });
});
