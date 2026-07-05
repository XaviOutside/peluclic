import type { ReactNode } from 'react';

type BadgeColor = 'green' | 'gray' | 'blue' | 'red' | 'yellow';

export interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  green: 'bg-primary-container/20 text-primary',
  gray: 'bg-surface-container-high text-on-surface-variant',
  blue: 'bg-tertiary-container/20 text-tertiary',
  red: 'bg-error-container text-on-error-container',
  yellow: 'bg-secondary-container/30 text-on-secondary-container',
};

export default function Badge({
  children,
  color = 'gray',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-headline font-medium ${colorStyles[color]} ${className}`}
    >
      {children}
    </span>
  );
}
