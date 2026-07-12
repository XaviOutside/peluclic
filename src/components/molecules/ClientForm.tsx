import { useState, type FormEvent } from 'react';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import { validateClientForm, isValid } from '@/utils/validation';
import type { FieldErrors } from '@/utils/validation';

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  phone2: string;
  address: string;
  notes: string;
}

export interface ClientFormProps {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => Promise<void>;
  isLoading?: boolean;
  serverErrors?: FieldErrors | null;
}

const emptyForm: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  phone2: '',
  address: '',
  notes: '',
};

export default function ClientForm({
  initialData,
  onSubmit,
  isLoading = false,
  serverErrors = null,
}: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    ...emptyForm,
    ...initialData,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  function handleChange(field: keyof ClientFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate on change if field was already touched
    if (touched.has(field)) {
      const errors = validateClientForm({ ...formData, [field]: value });
      setFieldErrors((prev) => ({
        ...prev,
        [field]: errors[field] ?? '',
      }));
    }
  }

  function handleBlur(field: keyof ClientFormData) {
    setTouched((prev) => new Set(prev).add(field));
    const errors = validateClientForm(formData);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: errors[field] ?? '',
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Validate all fields on submit
    const errors = validateClientForm(formData);
    setFieldErrors(errors);
    setTouched(new Set(['name', 'email', 'phone', 'phone2', 'address', 'notes']));

    if (!isValid(errors)) return;

    await onSubmit(formData);
  }

  function getFieldError(field: string): string | undefined {
    // Show server errors first, then client-side errors
    if (serverErrors?.[field]) return serverErrors[field];
    if (fieldErrors[field]) return fieldErrors[field];
    return undefined;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        onBlur={() => handleBlur('name')}
        error={getFieldError('name')}
        required
        placeholder="Client full name"
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        onBlur={() => handleBlur('email')}
        error={getFieldError('email')}
        required
        placeholder="client@example.com"
      />

      <Input
        label="Phone"
        type="tel"
        value={formData.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        onBlur={() => handleBlur('phone')}
        error={getFieldError('phone')}
        required
        placeholder="+1 (555) 123-4567"
      />

      <Input
        label="Secondary Phone"
        type="tel"
        value={formData.phone2}
        onChange={(e) => handleChange('phone2', e.target.value)}
        onBlur={() => handleBlur('phone2')}
        error={getFieldError('phone2')}
        placeholder="+1 (555) 987-6543"
      />

      <Input
        label="Address"
        value={formData.address}
        onChange={(e) => handleChange('address', e.target.value)}
        onBlur={() => handleBlur('address')}
        error={getFieldError('address')}
        placeholder="123 Main St, City"
      />

      <Input
        label="Notes"
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        onBlur={() => handleBlur('notes')}
        error={getFieldError('notes')}
        placeholder="Preferences, medical info, etc."
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" variant="primary" loading={isLoading}>
          {initialData ? 'Update Client' : 'Create Client'}
        </Button>
      </div>
    </form>
  );
}
