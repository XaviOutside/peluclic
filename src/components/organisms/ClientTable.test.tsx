import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ClientTable from './ClientTable';
import type { Client } from '@/types/client';

afterEach(cleanup);

const mockClients: Client[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '+1 (555) 111-1111',
    phone2: null,
    address: '123 Oak St',
    status: 'active',
    notes: null,
    lastServiceDate: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    phone: '+1 (555) 222-2222',
    phone2: '+1 (555) 333-3333',
    address: '456 Pine Ave',
    status: 'inactive',
    notes: null,
    lastServiceDate: null,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('ClientTable', () => {
  const handlers = {
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDeactivate: vi.fn(),
    onReactivate: vi.fn(),
  };

  it('renders client names', () => {
    render(<ClientTable clients={mockClients} {...handlers} />);
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('renders client emails', () => {
    render(<ClientTable clients={mockClients} {...handlers} />);
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<ClientTable clients={mockClients} {...handlers} />);
    // "Active" may appear in both table cell and mobile label, use getAllByText
    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('shows empty state when no clients', () => {
    render(<ClientTable clients={[]} {...handlers} />);
    expect(screen.getByText('No clients found.')).toBeInTheDocument();
  });

  it('opens actions dropdown and calls onView', () => {
    render(<ClientTable clients={mockClients} {...handlers} />);

    const actionButtons = screen.getAllByLabelText('Actions');
    fireEvent.click(actionButtons[0]);

    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Deactivate')).toBeInTheDocument();

    fireEvent.click(screen.getByText('View'));
    expect(handlers.onView).toHaveBeenCalledWith(mockClients[0]);
  });

  it('shows Reactivate for inactive clients', () => {
    render(<ClientTable clients={mockClients} {...handlers} />);

    const actionButtons = screen.getAllByLabelText('Actions');
    fireEvent.click(actionButtons[1]);

    expect(screen.getByText('Reactivate')).toBeInTheDocument();
  });
});
