import { type InputHTMLAttributes } from 'react';

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Called on every keystroke (for controlled components) */
  onValueChange?: (value: string) => void;
}

export default function SearchInput({
  onValueChange,
  className = '',
  placeholder = 'Search...',
  ...props
}: SearchInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onValueChange?.(e.target.value);
    props.onChange?.(e);
  }

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <span
        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none select-none"
        aria-hidden="true"
      >
        search
      </span>
      <input
        type="search"
        className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2 pl-10 text-body-md text-on-surface placeholder:text-outline-variant shadow-sm transition-all duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        placeholder={placeholder}
        data-testid="search-input"
        {...props}
        onChange={handleChange}
      />
    </div>
  );
}
