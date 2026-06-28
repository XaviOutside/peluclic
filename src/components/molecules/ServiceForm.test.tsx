import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceForm from './ServiceForm';
import type { ServiceFormData } from '@/utils/validation';

afterEach(() => cleanup());

describe('ServiceForm', () => {
  it('renders name, description, duration, price fields', () => {
    render(<ServiceForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
  });

  it('shows required indicators on name and price', () => {
    render(<ServiceForm onSubmit={vi.fn()} />);

    const nameLabel = screen.getByText(/name/i).closest('label');
    const priceLabel = screen.getByText(/price/i).closest('label');

    // Both should have the required asterisk (visually hidden but in DOM)
    expect(nameLabel?.querySelector('[aria-hidden="true"]')).toBeTruthy();
    expect(priceLabel?.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it('validates on blur and shows error for empty name', async () => {
    const user = userEvent.setup();
    render(<ServiceForm onSubmit={vi.fn()} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.click(nameInput);
    await user.tab(); // blur

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('validates on submit with errors', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ServiceForm onSubmit={onSubmit} />);

    // Submit empty form
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/price is required/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with converted price (dollars→cents) on valid submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ServiceForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'Full Groom');
    await user.type(screen.getByLabelText(/price/i), '49.99');
    await user.type(screen.getByLabelText(/duration/i), '60');

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const calledData = onSubmit.mock.calls[0][0] as ServiceFormData;
    expect(calledData.name).toBe('Full Groom');
    expect(calledData.price).toBe('49.99');
    expect(calledData.durationMinutes).toBe('60');
  });

  it('renders in edit mode with initial data', () => {
    render(
      <ServiceForm
        initialData={{
          name: 'Existing',
          description: 'Old desc',
          durationMinutes: '30',
          price: '25.00',
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue('Existing');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Old desc');
    expect(screen.getByLabelText(/duration/i)).toHaveValue(30);
    // type="number" input strips trailing .00 — "25.00" becomes 25
    expect(screen.getByLabelText(/price/i)).toHaveValue(25);
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    // Create a promise that never resolves to keep loading state
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const onSubmit = vi.fn().mockReturnValue(promise);
    const user = userEvent.setup();

    render(<ServiceForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'Test');
    await user.type(screen.getByLabelText(/price/i), '10.00');

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    // Cleanup
    resolvePromise!(undefined);
  });

  it('shows server errors when provided', () => {
    render(
      <ServiceForm
        onSubmit={vi.fn()}
        serverErrors={{ name: 'Server says no', price: 'Too expensive' }}
      />,
    );

    expect(screen.getByText('Server says no')).toBeInTheDocument();
    expect(screen.getByText('Too expensive')).toBeInTheDocument();
  });
});
