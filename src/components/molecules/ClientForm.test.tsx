import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientForm from './ClientForm';
import { encodeValidationError, VALIDATION_KEYS } from '@/utils/validation';

afterEach(cleanup);

describe('ClientForm', () => {
  it('renders all fields', () => {
    render(<ClientForm onSubmit={vi.fn()} />);

    // Placeholders now return i18n keys (mock: t(k) → k)
    expect(screen.getByPlaceholderText('form.placeholder.name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('form.placeholder.email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('form.placeholder.phone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('form.placeholder.secondaryPhone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('form.placeholder.address')).toBeInTheDocument();
  });

  it('shows validation errors on submit with empty data', async () => {
    render(<ClientForm onSubmit={vi.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /form.submit.create/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const nameKey = encodeValidationError(VALIDATION_KEYS.required, { field: 'Name' });
      const emailKey = encodeValidationError(VALIDATION_KEYS.required, { field: 'Email' });
      const phoneKey = encodeValidationError(VALIDATION_KEYS.required, { field: 'Phone' });
      expect(screen.getByText(nameKey)).toBeInTheDocument();
      expect(screen.getByText(emailKey)).toBeInTheDocument();
      expect(screen.getByText(phoneKey)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form data when valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ClientForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('form.placeholder.name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('form.placeholder.email'), 'john@example.com');
    await user.type(screen.getByPlaceholderText('form.placeholder.phone'), '+1 (555) 123-4567');
    await user.type(screen.getByPlaceholderText('form.placeholder.address'), '123 Main St');

    const submitBtn = screen.getByRole('button', { name: /form.submit.create/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        phone2: '',
        address: '123 Main St',
        notes: '',
      });
    });
  });

  it('displays server errors', () => {
    const serverErrors = { email: 'Email already in use' };

    render(
      <ClientForm
        onSubmit={vi.fn()}
        serverErrors={serverErrors}
      />,
    );

    expect(screen.getByText('Email already in use')).toBeInTheDocument();
  });

  it('pre-populates fields with initialData', () => {
    render(
      <ClientForm
        onSubmit={vi.fn()}
        initialData={{
          name: 'Pre-filled',
          email: 'pre@example.com',
          phone: '+1 (555) 000-0000',
        }}
      />,
    );

    expect(screen.getByPlaceholderText('form.placeholder.name')).toHaveValue('Pre-filled');
    expect(screen.getByPlaceholderText('form.placeholder.email')).toHaveValue('pre@example.com');
    expect(screen.getByPlaceholderText('form.placeholder.phone')).toHaveValue('+1 (555) 000-0000');
  });

  it('shows loading state on submit button', () => {
    render(<ClientForm onSubmit={vi.fn()} isLoading={true} />);

    const submitBtn = screen.getByRole('button', { name: /form.submit.create/i });
    expect(submitBtn).toBeDisabled();
  });
});
