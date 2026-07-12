import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PetForm from './PetForm';
import type { SelectOption } from '@/components/atoms/Select';
import { encodeValidationError, VALIDATION_KEYS } from '@/utils/validation';

afterEach(cleanup);

const mockClientOptions: SelectOption[] = [
  { value: '10', label: 'Alice Johnson' },
  { value: '20', label: 'Bob Smith' },
];

describe('PetForm', () => {
  it('renders all fields', () => {
    render(
      <PetForm onSubmit={vi.fn()} clientOptions={mockClientOptions} />,
    );

    // Placeholders now return i18n keys
    expect(screen.getByPlaceholderText('form.placeholder.name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('form.placeholder.species')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('form.placeholder.breed')).toBeInTheDocument();
    // Labels are i18n keys
    expect(screen.getByLabelText('form.label.sex')).toBeInTheDocument();
    expect(screen.getByLabelText('form.label.dateOfBirth')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('form.placeholder.weight')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('form.placeholder.notes')).toBeInTheDocument();
    expect(screen.getByLabelText('form.label.client')).toBeInTheDocument();
  });

  it('renders sex options as i18n keys', () => {
    render(
      <PetForm onSubmit={vi.fn()} clientOptions={mockClientOptions} />,
    );

    const sexSelect = screen.getByLabelText('form.label.sex') as HTMLSelectElement;
    const options = Array.from(sexSelect.options).map((o) => o.textContent);
    expect(options).toContain('sex.unknown');
    expect(options).toContain('sex.male');
    expect(options).toContain('sex.female');
  });

  it('renders client options from clientOptions prop', () => {
    render(
      <PetForm onSubmit={vi.fn()} clientOptions={mockClientOptions} />,
    );

    const clientSelect = screen.getByLabelText('form.label.client') as HTMLSelectElement;
    const options = Array.from(clientSelect.options).map((o) => o.textContent);
    expect(options).toContain('Alice Johnson');
    expect(options).toContain('Bob Smith');
  });

  it('shows validation errors on submit with empty data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <PetForm onSubmit={onSubmit} clientOptions={mockClientOptions} />,
    );

    const submitBtn = screen.getByRole('button', { name: /form.submit.create/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const nameKey = encodeValidationError(VALIDATION_KEYS.required, { field: 'Name' });
      const speciesKey = encodeValidationError(VALIDATION_KEYS.required, { field: 'Species' });
      const breedKey = encodeValidationError(VALIDATION_KEYS.required, { field: 'Breed' });
      const clientKey = encodeValidationError(VALIDATION_KEYS.required, { field: 'Client' });
      expect(screen.getByText(nameKey)).toBeInTheDocument();
      expect(screen.getByText(speciesKey)).toBeInTheDocument();
      expect(screen.getByText(breedKey)).toBeInTheDocument();
      expect(screen.getByText(clientKey)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form data when valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <PetForm onSubmit={onSubmit} clientOptions={mockClientOptions} />,
    );

    await user.type(screen.getByPlaceholderText('form.placeholder.name'), 'Buddy');
    await user.type(screen.getByPlaceholderText('form.placeholder.species'), 'Dog');
    await user.type(screen.getByPlaceholderText('form.placeholder.breed'), 'Labrador');
    await user.selectOptions(screen.getByLabelText('form.label.sex'), 'male');
    await user.type(screen.getByPlaceholderText('form.placeholder.weight'), '25.0');
    await user.type(screen.getByPlaceholderText('form.placeholder.notes'), 'Very friendly');
    await user.selectOptions(screen.getByLabelText('form.label.client'), '10');

    const submitBtn = screen.getByRole('button', { name: /form.submit.create/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Buddy',
        species: 'Dog',
        breed: 'Labrador',
        sex: 'male',
        dateOfBirth: '',
        weightKg: '25',
        notes: 'Very friendly',
        clientId: '10',
      });
    });
  });

  it('displays server errors', () => {
    const serverErrors = { name: 'Name already taken' };

    render(
      <PetForm
        onSubmit={vi.fn()}
        clientOptions={mockClientOptions}
        serverErrors={serverErrors}
      />,
    );

    expect(screen.getByText('Name already taken')).toBeInTheDocument();
  });

  it('pre-populates fields with initialData', () => {
    render(
      <PetForm
        onSubmit={vi.fn()}
        clientOptions={mockClientOptions}
        initialData={{
          name: 'Luna',
          species: 'Cat',
          breed: 'Siamese',
          sex: 'female',
          weightKg: '4.5',
          clientId: '20',
        }}
      />,
    );

    expect(screen.getByPlaceholderText('form.placeholder.name')).toHaveValue('Luna');
    expect(screen.getByPlaceholderText('form.placeholder.species')).toHaveValue('Cat');
    expect(screen.getByPlaceholderText('form.placeholder.breed')).toHaveValue('Siamese');
    expect(screen.getByPlaceholderText('form.placeholder.weight')).toHaveValue(4.5);
    expect(screen.getByLabelText('form.label.client')).toHaveValue('20');
    expect(screen.getByLabelText('form.label.sex')).toHaveValue('female');
  });

  it('shows loading state on submit button', () => {
    render(
      <PetForm
        onSubmit={vi.fn()}
        clientOptions={mockClientOptions}
        isLoading={true}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /form.submit.create/i });
    expect(submitBtn).toBeDisabled();
  });

  it('shows Update Pet button when initialData is provided', () => {
    render(
      <PetForm
        onSubmit={vi.fn()}
        clientOptions={mockClientOptions}
        initialData={{ name: 'Buddy' }}
      />,
    );

    expect(screen.getByRole('button', { name: /form.submit.update/i })).toBeInTheDocument();
  });

  it('validates field on blur after being touched', async () => {
    const user = userEvent.setup();

    render(
      <PetForm onSubmit={vi.fn()} clientOptions={mockClientOptions} />,
    );

    const nameInput = screen.getByPlaceholderText('form.placeholder.name');
    await user.click(nameInput);
    await user.tab();

    await waitFor(() => {
      const nameKey = encodeValidationError(VALIDATION_KEYS.required, { field: 'Name' });
      expect(screen.getByText(nameKey)).toBeInTheDocument();
    });
  });
});
