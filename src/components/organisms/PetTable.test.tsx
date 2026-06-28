import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PetTable from './PetTable';
import type { Pet } from '@/types/pet';

afterEach(cleanup);

const mockPets: Pet[] = [
  {
    id: 1,
    clientId: 10,
    name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever',
    sex: 'male',
    dateOfBirth: '2020-03-15T00:00:00Z',
    weightKg: 28.5,
    notes: 'Friendly with other dogs',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    clientId: 20,
    name: 'Luna',
    species: 'Cat',
    breed: 'Siamese',
    sex: 'female',
    dateOfBirth: null,
    weightKg: null,
    notes: null,
    status: 'inactive',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

const mockClientNames: Record<number, string> = {
  10: 'Alice Johnson',
  20: 'Bob Smith',
};

describe('PetTable', () => {
  const handlers = {
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDeactivate: vi.fn(),
    onReactivate: vi.fn(),
  };

  it('renders pet names', () => {
    render(
      <PetTable pets={mockPets} clientNames={mockClientNames} {...handlers} />,
    );
    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Luna')).toBeInTheDocument();
  });

  it('renders species and breed', () => {
    render(
      <PetTable pets={mockPets} clientNames={mockClientNames} {...handlers} />,
    );
    expect(screen.getByText('Dog')).toBeInTheDocument();
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText('Cat')).toBeInTheDocument();
    expect(screen.getByText('Siamese')).toBeInTheDocument();
  });

  it('renders client names from clientNames map', () => {
    render(
      <PetTable pets={mockPets} clientNames={mockClientNames} {...handlers} />,
    );
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(
      <PetTable pets={mockPets} clientNames={mockClientNames} {...handlers} />,
    );
    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('shows empty state when no pets', () => {
    render(<PetTable pets={[]} {...handlers} />);
    expect(screen.getByText('No pets found.')).toBeInTheDocument();
  });

  it('opens actions dropdown and calls onView', () => {
    render(
      <PetTable pets={mockPets} clientNames={mockClientNames} {...handlers} />,
    );

    const actionButtons = screen.getAllByLabelText('Actions');
    fireEvent.click(actionButtons[0]);

    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Deactivate')).toBeInTheDocument();

    fireEvent.click(screen.getByText('View'));
    expect(handlers.onView).toHaveBeenCalledWith(mockPets[0]);
  });

  it('shows Reactivate for inactive pets', () => {
    render(
      <PetTable pets={mockPets} clientNames={mockClientNames} {...handlers} />,
    );

    const actionButtons = screen.getAllByLabelText('Actions');
    fireEvent.click(actionButtons[1]);

    expect(screen.getByText('Reactivate')).toBeInTheDocument();
  });

  it('shows client ID when clientNames map has no entry', () => {
    const { rerender } = render(
      <PetTable pets={mockPets} clientNames={{}} {...handlers} />,
    );
    expect(screen.getByText('Client #10')).toBeInTheDocument();
    expect(screen.getByText('Client #20')).toBeInTheDocument();

    // Also works without clientNames prop at all
    rerender(<PetTable pets={mockPets} {...handlers} />);
    expect(screen.getByText('Client #10')).toBeInTheDocument();
  });
});
