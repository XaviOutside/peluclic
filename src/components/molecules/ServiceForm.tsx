import { useState, type FormEvent } from 'react';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import { validateServiceForm, isValid } from '@/utils/validation';
import type { FieldErrors, ServiceFormData } from '@/utils/validation';

export type { ServiceFormData } from '@/utils/validation';

export interface ServiceFormProps {
  initialData?: Partial<ServiceFormData>;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  isLoading?: boolean;
  serverErrors?: FieldErrors | null;
}

const emptyForm: ServiceFormData = {
  name: '',
  description: '',
  durationMinutes: '',
  price: '',
};

export default function ServiceForm({
  initialData,
  onSubmit,
  isLoading = false,
  serverErrors = null,
}: ServiceFormProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    ...emptyForm,
    ...initialData,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const isEdit = !!initialData && Object.keys(initialData).length > 0;

  function handleChange(field: keyof ServiceFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touched.has(field)) {
      const errors = validateServiceForm({ ...formData, [field]: value });
      setFieldErrors((prev) => ({
        ...prev,
        [field]: errors[field] ?? '',
      }));
    }
  }

  function handleBlur(field: keyof ServiceFormData) {
    setTouched((prev) => new Set(prev).add(field));
    const errors = validateServiceForm(formData);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: errors[field] ?? '',
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const errors = validateServiceForm(formData);
    setFieldErrors(errors);
    setTouched(new Set(['name', 'description', 'durationMinutes', 'price']));

    if (!isValid(errors)) return;

    await onSubmit(formData);
  }

  function getFieldError(field: string): string | undefined {
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
        placeholder="Service name"
      />

      <Input
        label="Description"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        onBlur={() => handleBlur('description')}
        error={getFieldError('description')}
        placeholder="Service description (optional)"
      />

      <Input
        label="Duration (minutes)"
        type="number"
        value={formData.durationMinutes}
        onChange={(e) => handleChange('durationMinutes', e.target.value)}
        onBlur={() => handleBlur('durationMinutes')}
        error={getFieldError('durationMinutes')}
        placeholder="e.g. 60"
        min="1"
        step="1"
      />

      <Input
        label="Price ($)"
        type="number"
        value={formData.price}
        onChange={(e) => handleChange('price', e.target.value)}
        onBlur={() => handleBlur('price')}
        error={getFieldError('price')}
        required
        placeholder="e.g. 49.99"
        min="0"
        step="0.01"
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" variant="primary" loading={isLoading}>
          {isEdit ? 'Update Service' : 'Create Service'}
        </Button>
      </div>
    </form>
  );
}
