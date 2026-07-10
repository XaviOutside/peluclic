import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
}

export default function Select({
  label,
  options,
  error,
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={selectId}
        className="text-label-md text-on-surface-variant"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`rounded-md border bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface shadow-sm transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          error
            ? 'border-error focus:border-error focus:ring-error/30'
            : 'border-outline-variant'
        } ${className}`}
        aria-invalid={!!error}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-label-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
