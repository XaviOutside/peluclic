import type { ImgHTMLAttributes } from 'react';

export interface AvatarProps {
  /** Display name used to extract initials and derive color */
  name: string;
  /** Optional image src — when provided, shows image instead of initials */
  src?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** Image element props (alt, etc.) forwarded when src is set */
  imgProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>;
}

const BG_COLORS = [
  'bg-primary-container text-on-primary-container',
  'bg-secondary-container text-on-secondary-container',
  'bg-tertiary-container text-on-tertiary-container',
  'bg-secondary-fixed-dim text-on-secondary-fixed',
  'bg-primary-fixed-dim text-on-primary-fixed',
];

const SIZE_STYLES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

/**
 * Derive a stable color index from a name string.
 * Uses a simple hash so the same name always gets the same color.
 */
function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash) % BG_COLORS.length;
}

/**
 * Extract initials from a name (up to 2 chars).
 * "María García" → "MG", "Carlos" → "C"
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({
  name,
  src,
  size = 'md',
  className = '',
  imgProps,
}: AvatarProps) {
  const initials = getInitials(name);
  const colorClass = BG_COLORS[getColorIndex(name)];

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-headline font-bold ${SIZE_STYLES[size]} ${colorClass} ${className}`}
      role="img"
      aria-label={name}
      data-testid="avatar"
    >
      {src ? (
        <img
          src={src}
          alt={imgProps?.alt ?? name}
          className="h-full w-full rounded-full object-cover"
          {...imgProps}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}
