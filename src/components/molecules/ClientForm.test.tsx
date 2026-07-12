import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientForm from './ClientForm';

afterEach(cleanup);

describe('ClientForm', () => {
  it('renders all fields', () => {
    render(<ClientForm onSubmit={vi.fn()} />);

    expect(screen.getByPlaceholderText('Client full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('client@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+1 (555) 123-4567')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+1 (555) 987-6543')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('123 Main St, City')).toBeInTheDocument();
  });

  it('shows validation errors on submit with empty data', async () => {
    render(<ClientForm onSubmit={vi.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /create client/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Phone is required')).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form data when valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ClientForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('Client full name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('client@example.com'), 'john@example.com');
    await user.type(screen.getByPlaceholderText('+1 (555) 123-4567'), '+1 (555) 123-4567');
    await user.type(screen.getByPlaceholderText('123 Main St, City'), '123 Main St');

    const submitBtn = screen.getByRole('button', { name: /create client/i });
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

    expect(screen.getByPlaceholderText('Client full name')).toHaveValue('Pre-filled');
    expect(screen.getByPlaceholderText('client@example.com')).toHaveValue('pre@example.com');
    expect(screen.getByPlaceholderText('+1 (555) 123-4567')).toHaveValue('+1 (555) 000-0000');
  });

  it('shows loading state on submit button', () => {
    render(<ClientForm onSubmit={vi.fn()} isLoading={true} />);

    const submitBtn = screen.getByRole('button', { name: /create client/i });
    expect(submitBtn).toBeDisabled();
  });
});
