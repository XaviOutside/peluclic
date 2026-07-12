import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceForm from './ServiceForm';
import type { ServiceFormData } from '@/utils/validation';
import { encodeValidationError, VALIDATION_KEYS } from '@/utils/validation';

afterEach(() => cleanup());

const nameKey = encodeValidationError(VALIDATION_KEYS.required, { field: 'Name' });
const priceKey = encodeValidationError(VALIDATION_KEYS.required, { field: 'Price' });

describe('ServiceForm', () => {
  it('renders name, description, duration, price fields', () => {
    render(<ServiceForm onSubmit={vi.fn()} />);

    // Labels are i18n keys — check via placeholders
    expect(screen.getByPlaceholderText('form.placeholder.name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('form.placeholder.description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('form.placeholder.duration')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('form.placeholder.price')).toBeInTheDocument();
  });

  it('shows required indicators on name and price', () => {
    render(<ServiceForm onSubmit={vi.fn()} />);

    const nameLabel = screen.getByText('form.label.name').closest('label');
    const priceLabel = screen.getByText('form.label.price').closest('label');

    expect(nameLabel?.querySelector('[aria-hidden="true"]')).toBeTruthy();
    expect(priceLabel?.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it('validates on blur and shows error for empty name', async () => {
    const user = userEvent.setup();
    render(<ServiceForm onSubmit={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText('form.placeholder.name');
    await user.click(nameInput);
    await user.tab(); // blur

    await waitFor(() => {
      expect(screen.getByText(nameKey)).toBeInTheDocument();
    });
  });

  it('validates on submit with errors', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ServiceForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /form.submit.create/i }));

    await waitFor(() => {
      expect(screen.getByText(nameKey)).toBeInTheDocument();
      expect(screen.getByText(priceKey)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with converted price (dollars→cents) on valid submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ServiceForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('form.placeholder.name'), 'Full Groom');
    await user.type(screen.getByPlaceholderText('form.placeholder.price'), '49.99');
    await user.type(screen.getByPlaceholderText('form.placeholder.duration'), '60');

    await user.click(screen.getByRole('button', { name: /form.submit.create/i }));

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

    expect(screen.getByPlaceholderText('form.placeholder.name')).toHaveValue('Existing');
    expect(screen.getByPlaceholderText('form.placeholder.description')).toHaveValue('Old desc');
    expect(screen.getByPlaceholderText('form.placeholder.duration')).toHaveValue(30);
    expect(screen.getByPlaceholderText('form.placeholder.price')).toHaveValue(25);
    expect(screen.getByRole('button', { name: /form.submit.update/i })).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const onSubmit = vi.fn().mockReturnValue(promise);
    const user = userEvent.setup();

    render(<ServiceForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('form.placeholder.name'), 'Test');
    await user.type(screen.getByPlaceholderText('form.placeholder.price'), '10.00');

    await user.click(screen.getByRole('button', { name: /form.submit.create/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

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
