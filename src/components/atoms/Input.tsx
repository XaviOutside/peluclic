import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export default function Input({
  label,
  error,
  required = false,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-label-md text-on-surface-variant"
      >
        {label}
        {required && <span className="ml-1 text-error" aria-hidden="true">*</span>}
      </label>
      <input
        id={inputId}
        className={`rounded-md border bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-outline shadow-sm transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          error
            ? 'border-error focus:border-error focus:ring-error/30'
            : 'border-outline-variant'
        } ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-caption text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
