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
      const consentKey = encodeValidationError(VALIDATION_KEYS.required, { field: 'GDPR consent' });
      expect(screen.getByText(nameKey)).toBeInTheDocument();
      expect(screen.getByText(emailKey)).toBeInTheDocument();
      expect(screen.getByText(phoneKey)).toBeInTheDocument();
      expect(screen.getByText(consentKey)).toBeInTheDocument();
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

    // Check the GDPR consent checkbox
    const consentCheckbox = screen.getByRole('checkbox', { name: /form.consent.label/i });
    await user.click(consentCheckbox);

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
        consentGivenAt: expect.any(String),
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

  it('renders mandatory GDPR consent checkbox with label', () => {
    render(<ClientForm onSubmit={vi.fn()} />);

    const checkbox = screen.getByRole('checkbox', { name: /form.consent.label/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('shows validation error when GDPR checkbox is unchecked on submit', async () => {
    render(<ClientForm onSubmit={vi.fn()} />);

    // Fill in valid data
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('form.placeholder.name'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('form.placeholder.email'), 'jane@example.com');
    await user.type(screen.getByPlaceholderText('form.placeholder.phone'), '555-1234');

    const submitBtn = screen.getByRole('button', { name: /form.submit.create/i });
    await user.click(submitBtn);

    await waitFor(() => {
      // The consent checkbox should trigger a validation error
      const errorKey = encodeValidationError(VALIDATION_KEYS.required, { field: 'GDPR consent' });
      expect(screen.getByText(errorKey)).toBeInTheDocument();
    });
  });

  it('includes consentGivenAt in submit payload when checkbox is checked', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ClientForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('form.placeholder.name'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('form.placeholder.email'), 'jane@example.com');
    await user.type(screen.getByPlaceholderText('form.placeholder.phone'), '555-1234');

    // Check the GDPR checkbox
    const checkbox = screen.getByRole('checkbox', { name: /form.consent.label/i });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    const submitBtn = screen.getByRole('button', { name: /form.submit.create/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '555-1234',
          consentGivenAt: expect.any(String),
        }),
      );
    });

    // Verify consentGivenAt is a valid ISO 8601 string
    const callArgs = onSubmit.mock.calls[0][0];
    expect(() => new Date(callArgs.consentGivenAt)).not.toThrow();
  });

  it('displays Art. 9 sensitive data warning near notes field', () => {
    render(<ClientForm onSubmit={vi.fn()} />);

    // Warning should be visible near the notes field
    expect(screen.getByText('form.warning.sensitiveData')).toBeInTheDocument();
  });
});
